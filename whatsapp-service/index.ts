import path from 'path';
import { config } from 'dotenv';
config({ path: path.resolve(process.cwd(), '.env.local') });

import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../lib/db/schema';

// Setup DB connection (PostgreSQL/Supabase)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("ERRO: DATABASE_URL não encontrada no .env.local");
    process.exit(1);
}

// Supabase requires SSL for remote connections. 
// We use postgres.js with SSL configured.
const queryClient = postgres(connectionString, {
    ssl: 'require',
    connect_timeout: 10,
});
const db = drizzle(queryClient, { schema });

// We need an ID to know WHICH user this WhatsApp instance belongs to.
async function getAdminUser() {
    const defaultUser = await db.query.users.findFirst();
    if (!defaultUser) {
        console.error("Nenhum usuário encontrado no banco. Faça login no painel web primeiro.");
        process.exit(1);
    }
    return defaultUser.id;
}

async function startWhatsAppService() {
    const userId = await getAdminUser();
    console.log(`Iniciando serviço de WhatsApp para o usuário ID: ${userId}`);

    // Create a new WhatsApp client with LocalAuth to persist sessions.
    const waClient = new Client({
        authStrategy: new LocalAuth({ clientId: userId }),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    waClient.on('qr', async (qrRaw: string) => {
        console.log('🔗 QR CODE RECEBIDO, gerando imagem base64 para o painel...');

        try {
            // Convert raw QR text to a base64 DataURI image
            const qrDataUri = await qrcode.toDataURL(qrRaw);

            // Save to the database so the Next.js Dashboard can fetch it
            await db.update(schema.whatsappConnections)
                .set({ status: 'qr', qrCode: qrDataUri, updatedAt: new Date() })
                .where(eq(schema.whatsappConnections.userId, userId));

            console.log('✅ QR Code salvo no banco de dados. Abra o Mini CRM para escanear.');
        } catch (error) {
            console.error('Erro ao gerar/salvar QR Code:', error);
        }
    });

    waClient.on('ready', async () => {
        console.log('🟢 CLIENTE WHATSAPP CONECTADO E PRONTO!');

        await db.update(schema.whatsappConnections)
            .set({ status: 'connected', qrCode: null, updatedAt: new Date() })
            .where(eq(schema.whatsappConnections.userId, userId));
    });

    waClient.on('disconnected', async (reason: string) => {
        console.log('🔴 WHATSAPP DESCONECTADO:', reason);
        await db.update(schema.whatsappConnections)
            .set({ status: 'disconnected', qrCode: null, updatedAt: new Date() })
            .where(eq(schema.whatsappConnections.userId, userId));
    });

    waClient.on('message', async (msg: any) => {
        if (msg.from === 'status@broadcast') return;

        const contactNumber = msg.from.split('@')[0];
        const messageBody = msg.body;
        console.log(`📩 Nova mensagem de ${contactNumber}: ${messageBody}`);

        try {
            // Dynamically import the AI processing logic from our Next.js backend services
            const chatService = require('../lib/services/chat');

            // Pass the incoming message to the LLM router
            const reply = await chatService.processIncomingMessage(userId, contactNumber, messageBody);

            if (reply) {
                console.log(`🤖 IA respondendo: ${reply}`);
                await waClient.sendMessage(msg.from, reply);
            }
        } catch (error) {
            console.error("Erro ao processar mensagem com IA:", error);
        }
    });

    // Start the client
    waClient.initialize();
}

startWhatsAppService();
