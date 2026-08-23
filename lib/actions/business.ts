'use server';

import { db } from '@/lib/db';
import { businessSettings, portfolioItems, servicePackages } from '@/lib/db/schema';
import { getDbUser } from './users';
import { and, asc, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { businessSettingsSchema, packageSchema } from '@/lib/validation';

export async function getBusinessConfiguration() {
  const dbUser = await getDbUser();
  const [settings, packages, portfolio] = await Promise.all([
    db.query.businessSettings.findFirst({ where: eq(businessSettings.userId, dbUser.id) }),
    db.select().from(servicePackages).where(eq(servicePackages.userId, dbUser.id)).orderBy(asc(servicePackages.createdAt)),
    db.select().from(portfolioItems).where(eq(portfolioItems.userId, dbUser.id)).orderBy(asc(portfolioItems.createdAt)),
  ]);
  return { settings, packages, portfolio };
}

export async function saveBusinessSettings(input: unknown) {
  const dbUser = await getDbUser();
  const data = businessSettingsSchema.parse(input);
  const existing = await db.query.businessSettings.findFirst({ where: eq(businessSettings.userId, dbUser.id) });
  if (existing) {
    await db.update(businessSettings).set({ ...data, updatedAt: new Date() })
      .where(eq(businessSettings.userId, dbUser.id));
  } else {
    await db.insert(businessSettings).values({ id: randomUUID(), userId: dbUser.id, ...data });
  }
  revalidatePath('/dashboard/configuracoes');
  return { success: true };
}

export async function savePackage(input: unknown, packageId?: string) {
  const dbUser = await getDbUser();
  const data = packageSchema.parse(input);
  if (packageId) {
    const result = await db.update(servicePackages).set({ ...data, updatedAt: new Date() })
      .where(and(eq(servicePackages.id, packageId), eq(servicePackages.userId, dbUser.id)))
      .returning({ id: servicePackages.id });
    if (!result.length) throw new Error('Pacote não encontrado');
  } else {
    packageId = randomUUID();
    await db.insert(servicePackages).values({ id: packageId, userId: dbUser.id, ...data });
  }
  revalidatePath('/dashboard/configuracoes');
  return { success: true, packageId };
}

export async function deletePackage(packageId: string) {
  const dbUser = await getDbUser();
  await db.delete(servicePackages).where(and(eq(servicePackages.id, packageId), eq(servicePackages.userId, dbUser.id)));
  revalidatePath('/dashboard/configuracoes');
  return { success: true };
}

export async function addPortfolioItem(input: { title: string; category?: string; mediaUrl: string }) {
  const dbUser = await getDbUser();
  const title = input.title?.trim();
  let mediaUrl: URL;
  try { mediaUrl = new URL(input.mediaUrl); } catch { throw new Error('URL do portfólio inválida'); }
  if (!title || !['http:', 'https:'].includes(mediaUrl.protocol)) throw new Error('Item de portfólio inválido');
  const id = randomUUID();
  await db.insert(portfolioItems).values({
    id, userId: dbUser.id, title: title.slice(0, 120),
    category: input.category?.trim().slice(0, 80) || null, mediaUrl: mediaUrl.toString(),
  });
  revalidatePath('/dashboard/configuracoes');
  return { success: true, id };
}

export async function deletePortfolioItem(itemId: string) {
  const dbUser = await getDbUser();
  await db.delete(portfolioItems).where(and(eq(portfolioItems.id, itemId), eq(portfolioItems.userId, dbUser.id)));
  revalidatePath('/dashboard/configuracoes');
  return { success: true };
}

