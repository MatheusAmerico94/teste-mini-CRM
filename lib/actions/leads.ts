'use server';

import { db } from '@/lib/db';
import { activities, leads, messages } from '@/lib/db/schema';
import { getDbUser } from './users';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { isLeadStatus, type LeadStatus } from '@/lib/crm';
import { AUTOMATION_BLOCKED_STATUSES } from '@/lib/crm';

function refreshLeadViews() {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/leads');
  revalidatePath('/dashboard/conversas');
}

export async function getLeads() {
  const dbUser = await getDbUser();
  return db.query.leads.findMany({
    where: and(eq(leads.userId, dbUser.id), isNull(leads.deletedAt)),
    orderBy: [desc(leads.updatedAt)],
  });
}

export async function createLead(data: {
  name: string; email?: string; phone?: string; estimatedValue?: number; notes?: string;
}) {
  const dbUser = await getDbUser();
  const name = data.name?.trim();
  if (!name) throw new Error('Nome é obrigatório');
  const leadId = randomUUID();
  await db.insert(leads).values({
    id: leadId,
    userId: dbUser.id,
    name: name.slice(0, 160),
    email: data.email?.trim() || null,
    phone: data.phone?.trim() || null,
    estimatedValue: Number(data.estimatedValue || 0),
    notes: data.notes?.trim() || null,
    status: 'novo',
    aiEnabled: true,
  });
  refreshLeadViews();
  return { success: true, leadId };
}

export async function updateLeadStatus(leadId: string, newStatus: string) {
  if (!isLeadStatus(newStatus)) throw new Error('Status inválido');
  const dbUser = await getDbUser();
  const lead = await db.query.leads.findFirst({
    where: and(eq(leads.id, leadId), eq(leads.userId, dbUser.id), isNull(leads.deletedAt)),
  });
  if (!lead) throw new Error('Lead não encontrado');
  const paid = newStatus === 'pago';
  await db.update(leads).set({
    status: newStatus,
    updatedAt: new Date(),
    ...(paid ? { paidAt: new Date(), aiEnabled: false, handoffAt: new Date(), paymentStatus: 'confirmed', conversationStage: 'payment_confirmed', awaitingManualPaymentReview: false } : {}),
  }).where(and(eq(leads.id, leadId), eq(leads.userId, dbUser.id)));
  await db.insert(activities).values({
    id: randomUUID(), userId: dbUser.id, leadId, type: 'status_mudou',
    content: `Status alterado de "${lead.status}" para "${newStatus}"`,
    metadata: JSON.stringify({ from: lead.status, to: newStatus }),
  });
  refreshLeadViews();
  return { success: true };
}

export async function setLeadAutomation(leadId: string, enabled: boolean) {
  const dbUser = await getDbUser();
  const lead = await db.query.leads.findFirst({
    where: and(eq(leads.id, leadId), eq(leads.userId, dbUser.id), isNull(leads.deletedAt)),
  });
  if (!lead) throw new Error('Lead não encontrado');
  if (enabled && AUTOMATION_BLOCKED_STATUSES.has((lead.status || 'novo') as LeadStatus)) {
    throw new Error('A IA não pode ser reativada após o pagamento');
  }
  await db.update(leads).set({
    aiEnabled: enabled,
    handoffAt: enabled ? null : new Date(),
    humanHandoff: !enabled,
    conversationStage: enabled ? lead.conversationStage : 'human_handoff',
    updatedAt: new Date(),
  }).where(and(eq(leads.id, leadId), eq(leads.userId, dbUser.id)));
  await db.insert(activities).values({
    id: randomUUID(), userId: dbUser.id, leadId, type: enabled ? 'ia_ativada' : 'atendimento_humano',
    content: enabled ? 'Conversa devolvida para a IA' : 'Atendimento assumido por uma pessoa',
  });
  refreshLeadViews();
  return { success: true };
}

export async function confirmManualPayment(leadId: string) {
  return updateLeadStatus(leadId, 'pago' satisfies LeadStatus);
}

export async function getLeadMessages(leadId: string) {
  const dbUser = await getDbUser();
  const lead = await db.query.leads.findFirst({
    where: and(eq(leads.id, leadId), eq(leads.userId, dbUser.id), isNull(leads.deletedAt)),
  });
  if (!lead) return [];
  return db.select().from(messages)
    .where(and(eq(messages.leadId, leadId), eq(messages.userId, dbUser.id)))
    .orderBy(asc(messages.createdAt));
}
