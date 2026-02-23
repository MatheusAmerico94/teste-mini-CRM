'use server';

import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getDbUser() {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error('Não autorizado');

    let dbUser = await db.query.users.findFirst({
        where: eq(users.clerkUserId, clerkUser.id)
    });

    // Fallback if webhook hasn't run or failed (common in local dev)
    if (!dbUser) {
        const id = crypto.randomUUID();
        await db.insert(users).values({
            id,
            clerkUserId: clerkUser.id,
            email: clerkUser.emailAddresses?.[0]?.emailAddress || 'no-email@example.com',
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Usuário',
            avatarUrl: clerkUser.imageUrl,
            createdAt: new Date(),
        });

        dbUser = await db.query.users.findFirst({
            where: eq(users.clerkUserId, clerkUser.id)
        });
    }

    return dbUser!;
}
