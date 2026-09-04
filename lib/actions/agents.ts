'use server';

import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { getDbUser } from './users';
import { and, desc, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { agentSchema } from '@/lib/validation';
import { encryptSecret, maskSecret } from '@/lib/security/crypto';
import { ensureDefaultAgentsForUser } from '../services/default-agents';

export type AgentInput = {
  name: string;
  personality: string;
  provider?: 'openai';
  model?: string;
  apiKey?: string;
  isActive?: boolean;
  role?: 'router' | 'specialist';
  serviceKey?: 'general' | 'photos' | 'sites';
};

export async function getAgents() {
  const dbUser = await getDbUser();
  await ensureDefaultAgentsForUser(dbUser.id);
  const rows = await db.select().from(agents)
    .where(eq(agents.userId, dbUser.id))
    .orderBy(desc(agents.createdAt));
  return rows.map((agent) => ({ ...agent, apiKey: maskSecret(agent.apiKey), hasApiKey: Boolean(agent.apiKey) }));
}

export async function createAgent(input: AgentInput) {
  const dbUser = await getDbUser();
  const data = agentSchema.parse(input);
  const agentId = randomUUID();
  await db.transaction(async (tx) => {
    if (data.isActive && data.role === 'router') {
      await tx.update(agents).set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(agents.userId, dbUser.id), eq(agents.role, 'router')));
    }
    await tx.insert(agents).values({
      id: agentId,
      userId: dbUser.id,
      ...data,
      apiKey: data.apiKey ? encryptSecret(data.apiKey) : null,
    });
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
  const apiKey = data.apiKey && !data.apiKey.startsWith('•')
    ? encryptSecret(data.apiKey)
    : existing.apiKey;
  await db.transaction(async (tx) => {
    if (data.isActive && data.role === 'router') {
      await tx.update(agents).set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(agents.userId, dbUser.id), eq(agents.role, 'router'), ne(agents.id, agentId)));
    }
    await tx.update(agents)
      .set({ ...data, apiKey, updatedAt: new Date() })
      .where(and(eq(agents.id, agentId), eq(agents.userId, dbUser.id)));
  });
  revalidatePath('/dashboard/agents');
  return { success: true };
}
export async function deleteAgent(agentId: string) {
  const dbUser = await getDbUser();
  await db.delete(agents).where(and(eq(agents.id, agentId), eq(agents.userId, dbUser.id)));
  revalidatePath('/dashboard/agents');
  return { success: true };
}
