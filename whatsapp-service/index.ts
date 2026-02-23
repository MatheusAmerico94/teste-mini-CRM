import path from 'path';
import { config } from 'dotenv';
config({ path: path.resolve(process.cwd(), '.env.local') });

import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    isJidBroadcast,
    Browsers
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../lib/db/schema';
import pino from 'pino';
import { randomUUID } from 'crypto';

// Setup DB connection (PostgreSQL/Supabase)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("ERRO: DATABASE_URL não encontrada no .env.local");
    process.exit(1);
}

const queryClient = postgres(connectionString, {
    ssl: 'require',
    connect_timeout: 10,
});
const db = drizzle(queryClient, { schema });

const logger = pino({ level: 'warn' }); // Use 'warn' to reduce noise in terminal

async function getAdminUser() {
    const defaultUser = await db.query.users.findFirst();
    if (!defaultUser) {
        console.error("Nenhum usuário encontrado no banco. Faça login no painel web primeiro.");
        process.exit(1);
    }
    return defaultUser.id;
}

/**
 * Upsert the whatsappConnections row for this user.
 * If no row exists, we INSERT one. Then we UPDATE the fields we need.
 */
async function upsertConnection(userId: string, data: { status: string; qrCode?: string | null }) {
    const existing = await db.query.whatsappConnections.findFirst({
        where: eq(schema.whatsappConnections.userId, userId)
    });

    if (existing) {
        // Update existing row
        await db.update(schema.whatsappConnections)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(schema.whatsappConnections.userId, userId));
    } else {
        // Insert new row
        await db.insert(schema.whatsappConnections).values({
            id: randomUUID(),
            userId,
            status: data.status,
            qrCode: data.qrCode ?? null,
        });
    }
    console.log(`✅ DB atualizado: status=${data.status}, temQR=${!!data.qrCode}`);
}

async function startWhatsAppService() {
    const userId = await getAdminUser();
    console.log(`🚀 Iniciando Baileys para o usuário ID: ${userId}`);

    const { state, saveCreds } = await useMultiFileAuthState(path.join(process.cwd(), `whatsapp-auth-${userId}`));
    const { version } = await fetchLatestBaileysVersion();
    console.log(`📦 Usando Baileys versão da WA: ${version.join('.')}`);

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        browser: Browsers.ubuntu('Chrome'),
        logger,
        generateHighQualityLinkPreview: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('🔗 QR CODE RECEBIDO! Salvando no banco...');
            try {
                const qrDataUri = await qrcode.toDataURL(qr);
                await upsertConnection(userId, { status: 'qr', qrCode: qrDataUri });
                console.log('✅ QR Code salvo! Acesse o Dashboard e atualize a página.');
            } catch (err) {
                console.error('❌ Erro ao salvar QR Code:', err);
            }
        }

        if (connection === 'close') {
            const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const shouldReconnect = reason !== DisconnectReason.loggedOut;
            console.log(`🔴 Conexão fechada. Razão: ${reason}. Reconectando: ${shouldReconnect}`);

            await upsertConnection(userId, { status: 'disconnected', qrCode: null });

            if (shouldReconnect) {
                setTimeout(startWhatsAppService, 3000);
            }
        } else if (connection === 'open') {
            console.log('🟢 CONECTADO! Agentes IA estão prontos para receber mensagens.');
            await upsertConnection(userId, { status: 'connected', qrCode: null });
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
            for (const msg of m.messages) {
                if (!msg.key.fromMe && !isJidBroadcast(msg.key.remoteJid!)) {
                    const from = msg.key.remoteJid!;
                    const contactNumber = from.split('@')[0];
                    const body = msg.message?.conversation ?? msg.message?.extendedTextMessage?.text;

                    if (body) {
                        console.log(`📩 Mensagem de ${contactNumber}: ${body}`);

                        try {
                            const chatService = require('../lib/services/chat');
                            const reply = await chatService.processIncomingMessage(userId, contactNumber, body);

                            if (reply) {
                                console.log(`🤖 IA respondendo para ${contactNumber}: ${reply}`);
                                await sock.sendMessage(from, { text: reply });
                            }
                        } catch (error) {
                            console.error("Erro ao processar mensagem com IA:", error);
                        }
                    }
                }
            }
        }
    });
}

startWhatsAppService();
