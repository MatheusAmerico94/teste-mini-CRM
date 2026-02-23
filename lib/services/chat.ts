import { db } from '@/lib/db';
import { agents, leads, activities } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import OpenAI from 'openai';

async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userMessage: string): Promise<{ reply: string, analysis: { isInterested: boolean, temperature: 'frio' | 'morno' | 'quente' } }> {
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
        model: model || "gpt-3.5-turbo",
        messages: [
            { role: "system", content: systemPrompt },
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

    // 3. Call LLM to get a reply and classify the lead
    const systemPrompt = `
Você é um assistente virtual pelo WhatsApp integrado a um CRM.
Sua personalidade e objetivo: ${activeAgent.personality}

O cliente acabou de enviar uma mensagem.
Retorne um JSON OBRIGATÓRIAMENTE com as seguintes chaves:
{
  "reply": "A SUA RESPOSTA PARA O CLIENTE (natural, amigável, seguindo sua personalidade)",
  "temperature": "A temperatura atual do lead baseado na mensagem dele. Valores válidos: 'frio', 'morno', ou 'quente'."
}

Regras para temperatura:
- frio: pouquíssimo interesse, apenas curioso, ou resposta monossilábica.
- morno: interesse demonstrado, fazendo perguntas sobre o produto/serviço.
- quente: querendo fechar negócio, pedindo preços, links de pagamento, ou demonstrando urgência.
    `;

    // Wait for the result from OpenAI (Fallback to groq/gemini logic if user changes provider later)
    let reply = "Mensagem recebida.";
    let analysis: { isInterested: boolean; temperature: "frio" | "morno" | "quente"; } = { isInterested: false, temperature: 'frio' };

    try {
        if (activeAgent.provider === 'openai') {
            const result = await callOpenAI(activeAgent.apiKey, activeAgent.model || 'gpt-3.5-turbo', systemPrompt, messageBody);
            reply = result.reply;
            analysis = result.analysis;
        } else {
            // Mock fallback para outros provedores não implementados ainda
            reply = `Olá! (Sou o agente ${activeAgent.name}, mas meu provedor não está configurado ainda)`;
            analysis = { isInterested: false, temperature: 'frio' };
        }
    } catch (err) {
        console.error("AI Error:", err);
        return null; // Do not send a reply if AI failed
    }

    // 4. Update the lead's temperature if it changed 
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

    // Log the message activity
    await db.insert(activities).values({
        id: crypto.randomUUID(),
        userId: userId,
        leadId: lead.id,
        type: 'whatsapp_message',
        content: `Cliente: ${messageBody}\nIA: ${reply}`,
        metadata: JSON.stringify({ direction: 'inbound_answered_by_ai' })
    });

    // 5. Return the reply to be sent back via WhatsApp
    return reply;
}
