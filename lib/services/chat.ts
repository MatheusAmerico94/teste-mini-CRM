import { db } from '@/lib/db';
import { agents, leads, activities } from '@/lib/db/schema';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import OpenAI from 'openai';

async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userMessage: string, history: any[] = []): Promise<{ reply: string, analysis: { isInterested: boolean, temperature: 'frio' | 'morno' | 'quente' } }> {
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
        model: model || "gpt-3.5-turbo",
        messages: [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: userMessage }
        ],
        // Using response_format to ensure we get both a reply and the JSON classification
        response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0].message.content || "{}";

    try {
        const parsed = JSON.parse(responseContent);
        return {
            reply: parsed.reply || "Mensagem recebida.",
            analysis: {
                isInterested: parsed.temperature === 'quente' || parsed.temperature === 'morno',
                temperature: ['frio', 'morno', 'quente'].includes(parsed.temperature) ? parsed.temperature : 'frio'
            }
        };
    } catch (e) {
        console.error("Failed to parse OpenAI JSON response", e);
        return { reply: "Olá! Recebemos sua mensagem.", analysis: { isInterested: false, temperature: 'frio' } };
    }
}

export async function processIncomingMessage(userId: string, contactNumber: string, messageBody: string) {
    console.log(`Nova mensagem de ${contactNumber}: ${messageBody}`);

    // 1. Find the active agent for this user
    const activeAgent = await db.query.agents.findFirst({
        where: and(
            eq(agents.userId, userId),
            eq(agents.isActive, true)
        )
    });

    if (!activeAgent || !activeAgent.apiKey) {
        console.log("Nenhum agente ativo com API Key configurada encontrado para o usuário", userId);
        return null;
    }

    // 2. Find or create lead based on phone number
    let lead = await db.query.leads.findFirst({
        where: and(
            eq(leads.userId, userId),
            eq(leads.phone, contactNumber)
        )
    });

    if (!lead) {
        const leadId = crypto.randomUUID();
        await db.insert(leads).values({
            id: leadId,
            userId: userId,
            name: contactNumber, // Temporarily use number as name
            phone: contactNumber,
            status: 'novo',
            temperature: 'frio'
        });

        lead = await db.query.leads.findFirst({ where: eq(leads.id, leadId) });
    }

    if (!lead) return null;

    // 3. Fetch recent conversation history
    const recentMessages = await db.query.messages.findMany({
        where: eq(schema.messages.leadId, lead.id),
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
        limit: 10 // Pega as últimas 10 mensagens para memória
    });

    // Format history for OpenAI
    const history = recentMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
    }));

    // 4. Call LLM to get a reply and classify the lead
    const systemPrompt = `
Você é um assistente virtual pelo WhatsApp integrado a um CRM.
O nome do seu contato é: ${lead.name !== lead.phone ? lead.name : 'Cliente'}
Sua personalidade e objetivo: ${activeAgent.personality}

O cliente acabou de enviar uma mensagem. O histórico da conversa foi fornecido.
Retorne um JSON OBRIGATÓRIAMENTE com as seguintes chaves:
{
  "reply": "A SUA RESPOSTA PARA O CLIENTE (natural, amigável, seguindo sua personalidade)",
  "temperature": "A temperatura atual do lead baseado na mensagem dele. Valores válidos: 'frio', 'morno', ou 'quente'."
}

Regras:
- frio: pouquíssimo interesse, apenas curioso, ou resposta monossilábica.
- morno: interesse demonstrado, fazendo perguntas sobre o produto/serviço.
- quente: querendo fechar negócio, pedindo preços, links de pagamento, ou demonstrando urgência.
    `;

    // Wait for the result from OpenAI
    let reply = "Mensagem recebida.";
    let analysis: { isInterested: boolean; temperature: "frio" | "morno" | "quente"; } = { isInterested: false, temperature: 'frio' };

    try {
        if (activeAgent.provider === 'openai') {
            const result = await callOpenAI(activeAgent.apiKey, activeAgent.model || 'gpt-3.5-turbo', systemPrompt, messageBody, history);
            reply = result.reply;
            analysis = result.analysis;
        } else {
            reply = `Olá! (Sou o agente ${activeAgent.name}, mas meu provedor não está configurado ainda)`;
            analysis = { isInterested: false, temperature: 'frio' };
        }
    } catch (err) {
        console.error("AI Error:", err);
        return null;
    }

    // 5. Update the lead's temperature if it changed 
    if (lead.temperature !== analysis.temperature) {
        await db.update(leads)
            .set({ temperature: analysis.temperature, updatedAt: new Date() })
            .where(eq(leads.id, lead.id));

        // Log the change
        await db.insert(activities).values({
            id: crypto.randomUUID(),
            userId: userId,
            leadId: lead.id,
            type: 'temperature_changed',
            content: `IA alterou a temperatura de ${lead.temperature} para ${analysis.temperature}`,
            metadata: JSON.stringify({ from: lead.temperature, to: analysis.temperature })
        });
    }

    // 6. Save BOTH messages to memory table
    await db.insert(schema.messages).values([
        {
            id: crypto.randomUUID(),
            userId: userId,
            leadId: lead.id,
            role: 'user',
            content: messageBody
        },
        {
            id: crypto.randomUUID(),
            userId: userId,
            leadId: lead.id,
            role: 'assistant',
            content: reply
        }
    ]);

    // 7. Log the message activity for the dashboard UI
    await db.insert(activities).values({
        id: crypto.randomUUID(),
        userId: userId,
        leadId: lead.id,
        type: 'whatsapp_message',
        content: `Cliente: ${messageBody}\nIA: ${reply}`,
        metadata: JSON.stringify({ direction: 'inbound_answered_by_ai' })
    });

    // 8. Return the reply to be sent back via WhatsApp
    return reply;
}
