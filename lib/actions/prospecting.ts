'use server';

import { db } from '@/lib/db';
import { leads, prospects } from '@/lib/db/schema';
import { getDbUser } from './users';
import { and, desc, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { prospectSchema } from '@/lib/validation';
import { revalidatePath } from 'next/cache';
import { sendManualMessage } from './whatsapp';

function normalizePhone(value: string) { return value.replace(/\D/g, ''); }
function refresh() { revalidatePath('/dashboard/prospeccao'); revalidatePath('/dashboard/conversas'); revalidatePath('/dashboard/leads'); }

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
