'use server';

import { db } from '@/lib/db';
import { agents, leads, prospects } from '@/lib/db/schema';
import { getDbUser } from './users';
import { and, desc, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { prospectSchema } from '@/lib/validation';
import { revalidatePath } from 'next/cache';
import { sendManualMessage } from './whatsapp';
import { decryptSecret } from '@/lib/security/crypto';
import OpenAI from 'openai';
import mammoth from 'mammoth';

function normalizePhone(value: string) { return value.replace(/\D/g, ''); }
function refresh() { revalidatePath('/dashboard/prospeccao'); revalidatePath('/dashboard/conversas'); revalidatePath('/dashboard/leads'); }

type ExtractedProspect = { businessName: string; contactName?: string; phone: string; city?: string; niche?: string; websiteUrl?: string; websiteStatus: 'has_site' | 'no_site' | 'unknown'; websiteNotes?: string; personalizedMessage: string; contactApproved: false };

async function extractTextFromFile(file: File) {
  if (file.size === 0 || file.size > 8 * 1024 * 1024) throw new Error('Escolha um arquivo entre 1 KB e 8 MB');
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  if (name.endsWith('.docx')) return (await mammoth.extractRawText({ buffer })).value;
  if (name.endsWith('.pdf')) {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    try { return (await parser.getText()).text; } finally { await parser.destroy(); }
  }
  if (name.endsWith('.csv') || name.endsWith('.txt')) return buffer.toString('utf8');
  throw new Error('Formato não suportado. Envie CSV, TXT, DOCX ou PDF.');
}

export async function extractProspectsFromFile(formData: FormData) {
  const user = await getDbUser();
  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('Selecione um arquivo válido');
  const text = (await extractTextFromFile(file)).trim();
  if (!text) throw new Error('Não foi possível encontrar texto nesse arquivo');
  const configuredAgents = await db.select().from(agents).where(eq(agents.userId, user.id));
  const apiKey = configuredAgents.map((agent) => decryptSecret(agent.apiKey)).find(Boolean) || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Cadastre uma chave da OpenAI em Agentes IA para ler arquivos de texto, Word ou PDF');
  const completion = await new OpenAI({ apiKey }).chat.completions.create({
    model: 'gpt-4o-mini', response_format: { type: 'json_object' }, temperature: 0,
    messages: [{ role: 'system', content: 'Extraia somente os contatos de prospecção presentes no documento. Cada contato precisa conter: businessName (nome da empresa ou dono), contactName quando houver, phone, websiteUrl quando houver, websiteStatus (has_site, no_site ou unknown), websiteNotes quando houver e personalizedMessage (mensagem individual que será enviada). Não invente nomes, telefones, sites ou mensagens. Ignore linhas incompletas sem empresa/dono, telefone ou mensagem. Responda apenas JSON: {"prospects":[...]}. O texto pode vir de CSV, bloco de notas, Word ou PDF.' }, { role: 'user', content: text.slice(0, 100000) }],
  });
  const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}') as { prospects?: unknown[] };
  const rows = (parsed.prospects || []).map((row) => prospectSchema.safeParse(row)).filter((result) => result.success).map((result) => ({ ...result.data, contactApproved: false })) as ExtractedProspect[];
  if (!rows.length) throw new Error('Não encontrei contatos completos. Confira se cada um tem empresa ou nome, telefone e mensagem personalizada.');
  return { rows, count: rows.length, fileName: file.name };
}

export async function getProspects() {
  const user = await getDbUser();
  return db.select().from(prospects).where(eq(prospects.userId, user.id)).orderBy(desc(prospects.updatedAt));
}

export async function importProspects(rows: unknown[]) {
  const user = await getDbUser();
  const valid = rows.map((row) => prospectSchema.parse(row)).map((row) => ({ ...row, phone: normalizePhone(row.phone) })).filter((row) => row.phone.length >= 10);
  if (!valid.length) throw new Error('Nenhum contato válido foi encontrado na planilha');
  for (const row of valid) {
    const existing = await db.query.prospects.findFirst({ where: and(eq(prospects.userId, user.id), eq(prospects.phone, row.phone)) });
    const values = { ...row, websiteUrl: row.websiteUrl || null, websiteNotes: row.websiteNotes || null, contactName: row.contactName || null, city: row.city || null, niche: row.niche || null, updatedAt: new Date() };
    if (existing) await db.update(prospects).set(values).where(eq(prospects.id, existing.id));
    else await db.insert(prospects).values({ id: randomUUID(), userId: user.id, ...values, status: 'draft' });
  }
  refresh();
  return { success: true, count: valid.length };
}

export async function setProspectApproval(prospectId: string, contactApproved: boolean) {
  const user = await getDbUser();
  await db.update(prospects).set({ contactApproved, status: contactApproved ? 'reviewed' : 'draft', updatedAt: new Date() }).where(and(eq(prospects.id, prospectId), eq(prospects.userId, user.id)));
  refresh();
  return { success: true };
}

export async function sendProspectMessage(prospectId: string) {
  const user = await getDbUser();
  const prospect = await db.query.prospects.findFirst({ where: and(eq(prospects.id, prospectId), eq(prospects.userId, user.id)) });
  if (!prospect) throw new Error('Contato não encontrado');
  if (!prospect.contactApproved) throw new Error('Revise o contato e confirme que pode iniciar esta conversa antes de enviar');
  if (prospect.status === 'sent') throw new Error('Esta mensagem já foi enviada');
  let leadId = prospect.leadId;
  if (!leadId) {
    leadId = randomUUID();
    await db.insert(leads).values({ id: leadId, userId: user.id, name: prospect.contactName || prospect.businessName, company: prospect.businessName, phone: prospect.phone, source: 'prospeccao_manual', status: 'novo', aiEnabled: true, serviceKey: 'sites' });
  }
  await sendManualMessage(leadId, prospect.personalizedMessage);
  await db.update(prospects).set({ leadId, status: 'sent', lastContactedAt: new Date(), updatedAt: new Date() }).where(eq(prospects.id, prospect.id));
  refresh();
  return { success: true };
}
