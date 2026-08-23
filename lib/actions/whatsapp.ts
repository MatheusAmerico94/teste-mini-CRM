'use server';

import { db } from '@/lib/db';
import { leads, messages, whatsappConnections } from '@/lib/db/schema';
import { getDbUser } from './users';
import { and, eq } from 'drizzle-orm';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { randomUUID } from 'crypto';

async function callWorker(path: string, body: Record<string, unknown> = {}) {
  const url = process.env.WHATSAPP_SERVICE_URL;
  const token = process.env.WHATSAPP_SERVICE_TOKEN;
  if (!url || !token) throw new Error('Serviço do WhatsApp não configurado');
  const response = await fetch(`${url.replace(/\/$/, '')}${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body), cache: 'no-store',
  });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'Falha no serviço do WhatsApp');
  return response.json();
}

export async function getConnectionStatus() {
  noStore();
  const dbUser = await getDbUser();
  let connection = await db.query.whatsappConnections.findFirst({ where: eq(whatsappConnections.userId, dbUser.id) });
  if (!connection) {
    const id = randomUUID();
    await db.insert(whatsappConnections).values({ id, userId: dbUser.id, status: 'disconnected' });
    connection = await db.query.whatsappConnections.findFirst({ where: eq(whatsappConnections.id, id) });
  }
  return connection;
}

export async function connectWhatsApp() {
  const dbUser = await getDbUser();
  await callWorker('/connect', { userId: dbUser.id });
  revalidatePath('/dashboard/whatsapp');
  return { success: true };
}

export async function disconnectWhatsApp() {
  const dbUser = await getDbUser();
  await callWorker('/disconnect', { userId: dbUser.id });
  await db.update(whatsappConnections).set({ status: 'disconnected', qrCode: null, updatedAt: new Date() })
    .where(eq(whatsappConnections.userId, dbUser.id));
  revalidatePath('/dashboard/whatsapp');
  return { success: true };
}

export async function sendManualMessage(leadId: string, content: string) {
  const dbUser = await getDbUser();
  const lead = await db.query.leads.findFirst({ where: and(eq(leads.id, leadId), eq(leads.userId, dbUser.id)) });
  if (!lead?.phone || !content.trim()) throw new Error('Lead ou mensagem inválida');
  const result = await callWorker('/send', { userId: dbUser.id, phone: lead.phone, message: content.trim() });
  await db.insert(messages).values({ id: randomUUID(), userId: dbUser.id, leadId, role: 'assistant', content: content.trim(), externalId: result.messageId || null });
  revalidatePath('/dashboard/conversas');
  return { success: true };
}
