'use server';

import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { getDbUser } from './users';
import { and, desc, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { agentSchema } from '@/lib/validation';
import { encryptSecret, maskSecret } from '@/lib/security/crypto';

export type AgentInput = {
  name: string;
  personality: string;
  provider?: 'openai';
  model?: string;
  apiKey?: string;
  isActive?: boolean;
};

export async function getAgents() {
  const dbUser = await getDbUser();
  const rows = await db.select().from(agents)
    .where(eq(agents.userId, dbUser.id))
    .orderBy(desc(agents.createdAt));
  return rows.map((agent) => ({ ...agent, apiKey: maskSecret(agent.apiKey), hasApiKey: Boolean(agent.apiKey) }));
}

export async function createAgent(input: AgentInput) {
  const dbUser = await getDbUser();
  const data = agentSchema.parse(input);
  const agentId = randomUUID();
  if (data.isActive) {
    await db.update(agents).set({ isActive: false, updatedAt: new Date() })
      .where(eq(agents.userId, dbUser.id));
  }
  await db.insert(agents).values({
    id: agentId,
    userId: dbUser.id,
    ...data,
    apiKey: data.apiKey ? encryptSecret(data.apiKey) : null,
  });
  revalidatePath('/dashboard/agents');
  return { success: true, agentId };
}

export async function updateAgent(agentId: string, input: AgentInput) {
  const dbUser = await getDbUser();
  const data = agentSchema.parse(input);
  const existing = await db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.userId, dbUser.id)),
  });
  if (!existing) throw new Error('Agente não encontrado');
  if (data.isActive) {
    await db.update(agents).set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(agents.userId, dbUser.id), ne(agents.id, agentId)));
  }
  const apiKey = data.apiKey && !data.apiKey.startsWith('•')
    ? encryptSecret(data.apiKey)
    : existing.apiKey;
  await db.update(agents)
    .set({ ...data, apiKey, updatedAt: new Date() })
    .where(and(eq(agents.id, agentId), eq(agents.userId, dbUser.id)));
  revalidatePath('/dashboard/agents');
  return { success: true };
}
export async function deleteAgent(agentId: string) {
  const dbUser = await getDbUser();
  await db.delete(agents).where(and(eq(agents.id, agentId), eq(agents.userId, dbUser.id)));
  revalidatePath('/dashboard/agents');
  return { success: true };
}
