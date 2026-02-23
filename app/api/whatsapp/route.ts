import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { whatsappConnections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { processIncomingMessage } from '@/lib/services/chat';

// Note: In a production environment, you should NOT run whatsapp-web.js inside Next.js API Routes 
// because Vercel/Serverless environments kill idle functions. 
// A dedicated Node.js/Python server or an official API provider (like Gupshup, Twilio or Z-API) is strongly recommended.
// This is a minimal mock for demonstration of the flow.

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, action, number, message } = body;

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        if (action === 'initialize') {
            // Mock generating a QR Code
            const mockQrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; // 1x1 black pixel mock

            await db.update(whatsappConnections)
                .set({ status: 'qr', qrCode: mockQrCode, updatedAt: new Date() })
                .where(eq(whatsappConnections.userId, userId));

            // Simulate that after 10 seconds, the user scanned it
            setTimeout(async () => {
                await db.update(whatsappConnections)
                    .set({ status: 'connected', qrCode: null, updatedAt: new Date() })
                    .where(eq(whatsappConnections.userId, userId));
                console.log(`WhatsApp for User ${userId} is now CONNECTED.`);
            }, 10000);

            return NextResponse.json({ success: true, qr: mockQrCode });
        }

        if (action === 'incoming_message') {
            // Simulate an incoming message webhook
            const reply = await processIncomingMessage(userId, number, message);

            // In reality you would use client.sendMessage(number, reply)
            console.log(`Sending reply to ${number}: ${reply}`);

            return NextResponse.json({ success: true, reply });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (err) {
        console.error('WhatsApp API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
