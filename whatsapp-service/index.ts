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

const logger = pino({ level: 'info' });

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
    console.log(`🚀 Iniciando Baileys para o usuário ID: ${userId}`);

    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, `auth-info-${userId}`));
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        printQRInTerminal: true,
        browser: Browsers.ubuntu('Chrome'),
        logger,
        generateHighQualityLinkPreview: true,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('🔗 NOVO QR CODE RECEBIDO!');
            const qrDataUri = await qrcode.toDataURL(qr);
            await db.update(schema.whatsappConnections)
                .set({ status: 'qr', qrCode: qrDataUri, updatedAt: new Date() })
                .where(eq(schema.whatsappConnections.userId, userId));
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('🔴 Conexão fechada devido a ', lastDisconnect?.error, ', reconectando: ', shouldReconnect);

            await db.update(schema.whatsappConnections)
                .set({ status: 'disconnected', qrCode: null, updatedAt: new Date() })
                .where(eq(schema.whatsappConnections.userId, userId));

            if (shouldReconnect) {
                startWhatsAppService();
            }
        } else if (connection === 'open') {
            console.log('🟢 CONEXÃO ABERTA COM SUCESSO!');
            await db.update(schema.whatsappConnections)
                .set({ status: 'connected', qrCode: null, updatedAt: new Date() })
                .where(eq(schema.whatsappConnections.userId, userId));
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
            for (const msg of m.messages) {
                if (!msg.key.fromMe && !isJidBroadcast(msg.key.remoteJid!)) {
                    const from = msg.key.remoteJid!;
                    const contactNumber = from.split('@')[0];
                    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

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
