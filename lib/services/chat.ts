import { db } from '../db';
import { activities, agents, businessSettings, leads, messages, portfolioItems, servicePackages } from '../db/schema';
import { and, desc, eq, or } from 'drizzle-orm';
import OpenAI, { toFile } from 'openai/index.js';
import { randomUUID } from 'crypto';
import { decryptSecret } from '../security/crypto';

type MediaData = { type: 'image' | 'audio'; base64: string; mimeType?: string } | undefined;
type ContactData = { name?: string; avatarUrl?: string; legacyNumber?: string };
type AgentResult = {
  reply: string;
  temperature: 'frio' | 'morno' | 'quente';
  nextStatus?: 'atendimento' | 'oferta' | 'aguardando_pix';
  memoryUpdate?: Record<string, string | number | boolean>;
};

function safeMemory(value: string | null) {
  try { return value ? JSON.parse(value) : {}; } catch { return {}; }
}

export async function processIncomingMessage(
  userId: string,
  contactNumber: string,
  messageBody: string,
  mediaData?: MediaData,
  externalId?: string,
  contactData: ContactData = {},
) {
  if (externalId) {
    const duplicate = await db.query.messages.findFirst({ where: eq(messages.externalId, externalId) });
    if (duplicate) return null;
  }

  let lead = await db.query.leads.findFirst({
    where: and(
      eq(leads.userId, userId),
      contactData.legacyNumber
        ? or(eq(leads.phone, contactNumber), eq(leads.phone, contactData.legacyNumber))
        : eq(leads.phone, contactNumber),
    ),
  });
  if (!lead) {
    const id = randomUUID();
    await db.insert(leads).values({
      id, userId, name: contactData.name || contactNumber, phone: contactNumber,
      avatarUrl: contactData.avatarUrl || null,
      status: 'atendimento', temperature: 'frio', aiEnabled: true, source: 'whatsapp',
    });
    lead = await db.query.leads.findFirst({ where: eq(leads.id, id) });
  } else {
    const currentNameIsIdentifier = lead.name === lead.phone || lead.name === contactData.legacyNumber;
    const nextName = contactData.name && currentNameIsIdentifier ? contactData.name : lead.name;
    if (lead.phone !== contactNumber || nextName !== lead.name || (contactData.avatarUrl && contactData.avatarUrl !== lead.avatarUrl)) {
      await db.update(leads).set({
        phone: contactNumber,
        name: nextName,
        avatarUrl: contactData.avatarUrl || lead.avatarUrl,
        updatedAt: new Date(),
      }).where(and(eq(leads.id, lead.id), eq(leads.userId, userId)));
      lead = { ...lead, phone: contactNumber, name: nextName, avatarUrl: contactData.avatarUrl || lead.avatarUrl };
    }
  }
  if (!lead) throw new Error('Não foi possível criar o lead');

  const activeAgent = await db.query.agents.findFirst({ where: and(eq(agents.userId, userId), eq(agents.isActive, true)) });
  const apiKey = decryptSecret(activeAgent?.apiKey) || process.env.OPENAI_API_KEY;
  if (mediaData?.type === 'audio') {
    if (!apiKey) throw new Error('Nenhuma chave da OpenAI configurada para transcrever o áudio');
    const transcriptionClient = new OpenAI({ apiKey });
    const audioFile = await toFile(Buffer.from(mediaData.base64, 'base64'), 'mensagem.ogg', {
      type: mediaData.mimeType || 'audio/ogg',
    });
    const transcription = await transcriptionClient.audio.transcriptions.create({
      file: audioFile,
      model: 'gpt-4o-mini-transcribe',
    });
    messageBody = transcription.text.trim();
    if (!messageBody) throw new Error('O áudio não produziu uma transcrição');
  }

  await db.insert(messages).values({
    id: randomUUID(), userId, leadId: lead.id, role: 'user',
    content: mediaData?.type === 'audio' ? `[Áudio] ${messageBody}` : messageBody || '[Imagem recebida]', externalId: externalId || null,
    messageType: mediaData?.type || 'text',
  });

  if (!lead.aiEnabled || ['pago', 'aguardando_fotos', 'producao', 'entregue'].includes(lead.status || '')) {
    return null;
  }

  const [settings, packages, portfolio, history] = await Promise.all([
    db.query.businessSettings.findFirst({ where: eq(businessSettings.userId, userId) }),
    db.select().from(servicePackages).where(and(eq(servicePackages.userId, userId), eq(servicePackages.isActive, true))),
    db.select().from(portfolioItems).where(and(eq(portfolioItems.userId, userId), eq(portfolioItems.isActive, true))),
    db.select().from(messages).where(eq(messages.leadId, lead.id)).orderBy(desc(messages.createdAt)).limit(12),
  ]);

  if (!apiKey) throw new Error('Nenhuma chave da OpenAI configurada');
  if (!activeAgent) throw new Error('Nenhum agente ativo configurado');

  const catalog = packages.map((item) => ({
    name: item.name, description: item.description, price: item.price,
    imageCount: item.imageCount, deliveryDays: item.deliveryDays,
  }));
  const portfolioCatalog = portfolio.map((item) => ({ title: item.title, category: item.category, url: item.mediaUrl }));
  const currentDateTime = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date());
  const prompt = `Você é o atendente comercial de ${settings?.businessName || 'um estúdio de ensaios fotográficos com IA'} no WhatsApp.
Personalidade: ${activeAgent.personality}
Data e hora atuais em Brasília (fonte confiável): ${currentDateTime}.
Etapa atual: ${lead.status || 'atendimento'}.
Memória do cliente: ${JSON.stringify(safeMemory(lead.persistentMemory))}.
Pacotes autorizados: ${JSON.stringify(catalog)}.
Portfólio autorizado: ${JSON.stringify(portfolioCatalog)}.
Regras comerciais: ${settings?.salesInstructions || 'Seja breve, educado e conduza a conversa até a escolha de um pacote.'}
Saudação preferida: ${settings?.defaultGreeting || ''}
Pix manual: chave=${settings?.pixKey || 'não configurada'}, favorecido=${settings?.pixRecipient || 'não configurado'}.
Instruções de pagamento: ${settings?.paymentInstructions || 'Explique que a confirmação será manual.'}

Regras obrigatórias:
- Quando perguntarem a data, o dia da semana ou a hora atual, responda usando exclusivamente a data e hora atuais informadas acima.
- Você não possui acesso a clima, notícias ou outras informações externas em tempo real; seja transparente quando pedirem algo que não esteja neste contexto.
- Nunca invente preço, pacote, quantidade, prazo, desconto, URL ou dado Pix.
- Para perguntas sobre preço ou pacotes, use exclusivamente os Pacotes autorizados acima e informe claramente nome, preço, quantidade de imagens e prazo.
- Se houver mais de um pacote, ajude o cliente a escolher comparando apenas os dados cadastrados, sem criar vantagens ou descontos inexistentes.
- Não confirme pagamento. Diga que a confirmação é manual.
- Só envie a chave Pix depois que o cliente escolher claramente um pacote.
- Faça no máximo uma pergunta por mensagem e escreva de forma natural e curta.
- Se não houver pacote ou Pix configurado, explique que uma pessoa continuará o atendimento.
- Se o cliente pedir uma pessoa, responda de forma breve e não tente pressioná-lo.
- Retorne somente JSON: {"reply":"texto", "temperature":"frio|morno|quente", "nextStatus":"atendimento|oferta|aguardando_pix", "memoryUpdate":{}}.`;

  const client = new OpenAI({ apiKey });
  const content: any = mediaData?.type === 'image' ? [
    { type: 'text', text: messageBody || 'O cliente enviou esta imagem como referência.' },
    { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${mediaData.base64}` } },
  ] : messageBody;
  const orderedHistory = history.reverse().slice(0, -1).map((item) => ({
    role: item.role === 'user' ? 'user' as const : 'assistant' as const,
    content: item.content,
  }));
  const completion = await client.chat.completions.create({
    model: activeAgent.model || 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.4,
    messages: [{ role: 'system', content: prompt }, ...orderedHistory, { role: 'user', content }],
  });
  const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}') as Partial<AgentResult>;
  const reply = String(parsed.reply || '').trim();
  if (!reply) throw new Error('A OpenAI retornou uma resposta vazia');

  const temperature = ['frio', 'morno', 'quente'].includes(parsed.temperature || '') ? parsed.temperature! : lead.temperature || 'frio';
  const allowedStatuses = ['atendimento', 'oferta', 'aguardando_pix'];
  const nextStatus = allowedStatuses.includes(parsed.nextStatus || '') ? parsed.nextStatus! : lead.status || 'atendimento';
  const memory = parsed.memoryUpdate && typeof parsed.memoryUpdate === 'object'
    ? { ...safeMemory(lead.persistentMemory), ...parsed.memoryUpdate } : safeMemory(lead.persistentMemory);

  await db.transaction(async (tx) => {
    await tx.insert(messages).values({ id: randomUUID(), userId, leadId: lead.id, role: 'assistant', content: reply });
    await tx.update(leads).set({
      status: nextStatus, temperature, persistentMemory: JSON.stringify(memory),
      estimatedValue: nextStatus === 'aguardando_pix' && catalog.length === 1 ? catalog[0].price : lead.estimatedValue,
      updatedAt: new Date(),
    }).where(and(eq(leads.id, lead.id), eq(leads.userId, userId)));
    await tx.insert(activities).values({
      id: randomUUID(), userId, leadId: lead.id, type: 'whatsapp_message',
      content: `Cliente: ${messageBody || '[Imagem]'}\nIA: ${reply}`,
      metadata: JSON.stringify({ fromStatus: lead.status, toStatus: nextStatus }),
    });
  });
  return reply;
}
