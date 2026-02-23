'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { leads, activities } from '@/lib/db/schema';
import { getDbUser } from './users';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getLeads() {
    const dbUser = await getDbUser();

    return await db.query.leads.findMany({
        where: eq(leads.userId, dbUser.id),
        orderBy: [desc(leads.createdAt)]
    });
}

export async function createLead(data: Omit<typeof leads.$inferInsert, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    const dbUser = await getDbUser();

    const leadId = crypto.randomUUID();

    await db.insert(leads).values({
        id: leadId,
        userId: dbUser.id,
        ...data,
    });

    revalidatePath('/dashboard/leads');
    return { success: true, leadId };
}

export async function updateLeadStatus(leadId: string, newStatus: string) {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error('Não autorizado');

    const lead = await db.query.leads.findFirst({
        where: eq(leads.id, leadId)
    });

    if (!lead) throw new Error('Lead não encontrado');

    await db.update(leads)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(leads.id, leadId));

    await db.insert(activities).values({
        id: crypto.randomUUID(),
        userId: lead.userId,
        leadId,
        type: 'status_mudou',
        content: `Status Kanban alterado para "${newStatus}"`,
        metadata: JSON.stringify({ from: lead.status, to: newStatus })
    });

    revalidatePath('/dashboard/leads');
    return { success: true };
}

// Outras funções de CRUD (update, delete) iriam aqui
