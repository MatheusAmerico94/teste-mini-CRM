'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { getDbUser } from './users';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export type NewAgent = typeof agents.$inferInsert;

export async function getAgents() {
    const dbUser = await getDbUser();

    try {
        const userAgents = await db.select()
            .from(agents)
            .where(eq(agents.userId, dbUser.id))
            .orderBy(desc(agents.createdAt));

        return userAgents;
    } catch (error) {
        console.error('Error fetching agents:', error);
        return [];
    }
}

export async function createAgent(data: Omit<NewAgent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    const dbUser = await getDbUser();

    const agentId = randomUUID();

    await db.insert(agents).values({
        id: agentId,
        userId: dbUser.id,
        ...data,
    });

    revalidatePath('/dashboard/agents');
    return { success: true, agentId };
}

export async function updateAgent(agentId: string, data: Partial<NewAgent>) {
    const dbUser = await getDbUser();

    await db.update(agents)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(agents.id, agentId));

    revalidatePath('/dashboard/agents');
    return { success: true };
}

export async function deleteAgent(agentId: string) {
    const dbUser = await getDbUser();

    await db.delete(agents).where(eq(agents.id, agentId));

    revalidatePath('/dashboard/agents');
    return { success: true };
}
