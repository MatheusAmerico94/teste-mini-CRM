'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { getDbUser } from './users';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export type NewAgent = typeof agents.$inferInsert;

export async function getAgents() {
    const dbUser = await getDbUser();

    const userAgents = await db.query.agents.findMany({
        where: eq(agents.userId, dbUser.id),
        orderBy: (agents, { desc }) => [desc(agents.createdAt)],
    });

    return userAgents;
}

export async function createAgent(data: Omit<NewAgent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    const dbUser = await getDbUser();

    const agentId = crypto.randomUUID();

    await db.insert(agents).values({
        id: agentId,
        userId: dbUser.id,
        ...data,
    });

    revalidatePath('/dashboard/agents');
    return { success: true, agentId };
}

export async function updateAgent(agentId: string, data: Partial<NewAgent>) {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error('Não autorizado');

    await db.update(agents)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(agents.id, agentId));

    revalidatePath('/dashboard/agents');
    return { success: true };
}

export async function deleteAgent(agentId: string) {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error('Não autorizado');

    await db.delete(agents).where(eq(agents.id, agentId));

    revalidatePath('/dashboard/agents');
    return { success: true };
}
