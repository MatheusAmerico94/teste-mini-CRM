import path from 'path';
import { config } from 'dotenv';
config({ path: path.resolve(process.cwd(), '.env.local') });

import makeWASocket, {
  Browsers, DisconnectReason, downloadMediaMessage, fetchLatestBaileysVersion,
  isJidBroadcast, makeCacheableSignalKeyStore, useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import express from 'express';
import QRCode from 'qrcode';
import pino from 'pino';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import * as schema from '../lib/db/schema';
import { processIncomingMessage } from '../lib/services/chat';

const port = Number(process.env.PORT || 3001);
const serviceToken = process.env.WHATSAPP_SERVICE_TOKEN;
const sessionRoot = path.resolve(process.env.WHATSAPP_SESSION_DIR || './whatsapp-session');
const connectionString = process.env.DATABASE_URL;
if (!serviceToken) throw new Error('WHATSAPP_SERVICE_TOKEN não configurado');
if (!connectionString) throw new Error('DATABASE_URL não configurada');

const queryClient = postgres(connectionString, { ssl: 'require', prepare: false, connect_timeout: 15 });
const db = drizzle(queryClient, { schema });
const logger = pino({ level: process.env.LOG_LEVEL || 'warn' });
const app = express();
app.use(express.json({ limit: '1mb' }));

let sock: any = null;
let ownerUserId: string | null = null;
let starting = false;

function authorize(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.headers.authorization !== `Bearer ${serviceToken}`) return res.status(401).json({ error: 'Não autorizado' });
  next();
}

async function resolveOwnerUserId() {
  if (ownerUserId) return ownerUserId;
  const ownerEmail = process.env.CRM_OWNER_EMAIL?.trim().toLowerCase();
  if (!ownerEmail) throw new Error('CRM_OWNER_EMAIL não configurado');
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, ownerEmail) });
  if (!user) throw new Error(`Usuário ${ownerEmail} ainda não entrou no CRM`);
  ownerUserId = user.id;
  return user.id;
}

async function updateConnection(userId: string, values: Partial<typeof schema.whatsappConnections.$inferInsert>) {
  const existing = await db.query.whatsappConnections.findFirst({ where: eq(schema.whatsappConnections.userId, userId) });
  const safeValues = { ...values, sessionData: null, updatedAt: new Date() };
  if (existing) await db.update(schema.whatsappConnections).set(safeValues).where(eq(schema.whatsappConnections.userId, userId));
  else await db.insert(schema.whatsappConnections).values({ id: randomUUID(), userId, status: 'disconnected', ...safeValues });
}

async function startSocket(requestedUserId?: string) {
  if (starting || sock) return;
  starting = true;
  const userId = await resolveOwnerUserId();
  if (requestedUserId && requestedUserId !== userId) {
    starting = false;
    throw new Error('Este serviço pertence a outro usuário');
  }
  try {
    await fs.mkdir(sessionRoot, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(sessionRoot);
    const { version } = await fetchLatestBaileysVersion();
    sock = makeWASocket({
      version,
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
      browser: Browsers.ubuntu('Chrome'), logger, generateHighQualityLinkPreview: false,
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }: any) => {
      if (qr) {
        const qrCode = await QRCode.toDataURL(qr);
        await updateConnection(userId, { status: 'qr', qrCode, lastError: null });
      }
      if (connection === 'open') {
        const phoneNumber = sock?.user?.id?.split(':')[0] || null;
        await updateConnection(userId, { status: 'connected', qrCode: null, phoneNumber, lastError: null });
      }
      if (connection === 'close') {
        const reason = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
        const reconnect = reason !== DisconnectReason.loggedOut;
        sock = null;
        await updateConnection(userId, { status: 'disconnected', qrCode: null, lastError: reconnect ? 'Conexão interrompida; reconectando.' : null });
        if (reconnect) setTimeout(() => startSocket().catch(console.error), 3000);
      }
    });
    sock.ev.on('messages.upsert', async ({ type, messages: incoming }: any) => {
      if (type !== 'notify') return;
      for (const msg of incoming) {
        if (msg.key.fromMe || !msg.key.remoteJid || isJidBroadcast(msg.key.remoteJid)) continue;
        const jid = msg.key.remoteJid;
        const phone = jid.split('@')[0];
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || '';
        let mediaData: { type: 'image'; base64: string } | undefined;
        if (msg.message?.imageMessage) {
          const buffer = await downloadMediaMessage(msg, 'buffer', {});
          mediaData = { type: 'image', base64: buffer.toString('base64') };
        }
        if (!text && !mediaData) continue;
        const reply = await processIncomingMessage(userId, phone, text, mediaData, msg.key.id || undefined);
        if (reply) await sock?.sendMessage(jid, { text: reply });
      }
    });
  } catch (error) {
    sock = null;
    await updateConnection(userId, { status: 'disconnected', qrCode: null, lastError: error instanceof Error ? error.message : 'Falha ao iniciar WhatsApp' });
    throw error;
  } finally {
    starting = false;
  }
}

app.get('/health', (_req, res) => res.json({ ok: true, connected: Boolean(sock?.user), starting }));
app.post('/connect', authorize, async (req, res) => {
  try { await startSocket(req.body.userId); res.json({ success: true }); }
  catch (error) { res.status(500).json({ error: error instanceof Error ? error.message : 'Falha ao conectar' }); }
});
app.post('/disconnect', authorize, async (req, res) => {
  try {
    const userId = await resolveOwnerUserId();
    if (req.body.userId !== userId) return res.status(403).json({ error: 'Usuário inválido' });
    if (sock) await sock.logout();
    sock = null;
    await fs.rm(sessionRoot, { recursive: true, force: true });
    await updateConnection(userId, { status: 'disconnected', qrCode: null, phoneNumber: null, lastError: null });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error instanceof Error ? error.message : 'Falha ao desconectar' }); }
});
app.post('/send', authorize, async (req, res) => {
  try {
    const userId = await resolveOwnerUserId();
    if (req.body.userId !== userId || !sock?.user) return res.status(409).json({ error: 'WhatsApp desconectado' });
    const phone = String(req.body.phone || '').replace(/\D/g, '');
    const message = String(req.body.message || '').trim();
    if (!phone || !message) return res.status(400).json({ error: 'Telefone ou mensagem inválida' });
    const sent = await sock.sendMessage(`${phone}@s.whatsapp.net`, { text: message });
    res.json({ success: true, messageId: sent?.key?.id });
  } catch (error) { res.status(500).json({ error: error instanceof Error ? error.message : 'Falha ao enviar' }); }
});

app.listen(port, () => {
  console.log(`Serviço WhatsApp ouvindo na porta ${port}`);
  resolveOwnerUserId().then(async (userId) => {
    const connection = await db.query.whatsappConnections.findFirst({ where: and(eq(schema.whatsappConnections.userId, userId), eq(schema.whatsappConnections.status, 'connected')) });
    if (connection) startSocket(userId).catch(console.error);
  }).catch((error) => console.warn(error.message));
});
