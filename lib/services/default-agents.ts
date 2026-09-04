import { db } from '../db';
import { agents } from '../db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const DEFAULT_ROUTER_PROMPT = 'Você é o Cérebro do atendimento. Descubra com uma pergunta curta se a pessoa procura ensaio fotográfico com IA, criação de site ou outro serviço. Quando souber, encaminhe internamente sem explicar a troca.';
const DEFAULT_SITES_PROMPT = 'Você é um consultor de sites para pequenas empresas. Entenda o negócio, o objetivo e a necessidade digital. Seja claro, útil e consultivo; não invente preços, prazos ou condições que não estejam configurados.';

export async function ensureDefaultAgentsForUser(userId: string) {
  const current = await db.select().from(agents).where(eq(agents.userId, userId));
  const additions: Array<typeof agents.$inferInsert> = [];
  if (!current.some((agent) => agent.role === 'router')) {
    additions.push({ id: randomUUID(), userId, name: 'Cérebro', personality: DEFAULT_ROUTER_PROMPT, provider: 'openai', model: 'gpt-4o-mini', isActive: true, role: 'router', serviceKey: 'general' });
  }
  if (!current.some((agent) => agent.role === 'specialist' && agent.serviceKey === 'sites')) {
    additions.push({ id: randomUUID(), userId, name: 'Sites', personality: DEFAULT_SITES_PROMPT, provider: 'openai', model: 'gpt-4o-mini', isActive: true, role: 'specialist', serviceKey: 'sites' });
  }
  if (additions.length) await db.insert(agents).values(additions);
}
