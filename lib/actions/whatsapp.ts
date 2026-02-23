'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { whatsappConnections } from '@/lib/db/schema';
import { getDbUser } from './users';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getConnectionStatus() {
    const dbUser = await getDbUser();

    let connection = await db.query.whatsappConnections.findFirst({
        where: eq(whatsappConnections.userId, dbUser.id)
    });

    if (!connection) {
        // Create initial disconnected state
        const connId = crypto.randomUUID();
        await db.insert(whatsappConnections).values({
            id: connId,
            userId: dbUser.id,
            status: 'disconnected'
        });

        connection = await db.query.whatsappConnections.findFirst({
            where: eq(whatsappConnections.id, connId)
        });
    }

    return connection;
}

export async function disconnectWhatsApp() {
    const dbUser = await getDbUser();

    await db.update(whatsappConnections)
        .set({ status: 'disconnected', qrCode: null, sessionData: null, updatedAt: new Date() })
        .where(eq(whatsappConnections.userId, dbUser.id));

    // Todo: Tell the actual whatsapp service to logout

    revalidatePath('/dashboard/whatsapp');
    return { success: true };
}
