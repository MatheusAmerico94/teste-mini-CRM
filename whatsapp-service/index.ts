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
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import * as schema from '../lib/db/schema';
import { processIncomingMessage } from '../lib/services/chat';
import { decryptSecret, encryptSecret } from '../lib/security/crypto';

const port = Number(process.env.PORT || 3001);
const serviceToken = process.env.WHATSAPP_SERVICE_TOKEN;
let sessionRoot = path.resolve(process.env.WHATSAPP_SESSION_DIR || './whatsapp-session');
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
let sessionRevision = 0;
let persistTimer: NodeJS.Timeout | null = null;
let persistQueue = Promise.resolve();
const pendingConversations = new Map<string, { userId: string; socket: any; messages: any[]; timer: NodeJS.Timeout }>();

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
  const safeValues = { ...values, updatedAt: new Date() };
  if (existing) await db.update(schema.whatsappConnections).set(safeValues).where(eq(schema.whatsappConnections.userId, userId));
  else await db.insert(schema.whatsappConnections).values({ id: randomUUID(), userId, status: 'disconnected', ...safeValues });
}

async function restorePersistedSession(userId: string) {
  const localFiles: string[] = await fs.readdir(sessionRoot).catch((): string[] => []);
  if (localFiles.includes('creds.json')) return;
  const connection = await db.query.whatsappConnections.findFirst({ where: eq(schema.whatsappConnections.userId, userId) });
  const serialized = decryptSecret(connection?.sessionData);
  if (!serialized) return;
  const files = JSON.parse(serialized) as Record<string, string>;
  for (const [filename, contents] of Object.entries(files)) {
    if (path.basename(filename) !== filename || !filename.endsWith('.json')) continue;
    await fs.writeFile(path.join(sessionRoot, filename), contents, 'utf8');
  }
}

async function persistSession(userId: string, revision: number) {
  if (revision !== sessionRevision) return;
  const filenames = (await fs.readdir(sessionRoot).catch((): string[] => [])).filter((filename) => filename.endsWith('.json'));
  if (!filenames.includes('creds.json')) return;
  const entries = await Promise.all(filenames.map(async (filename) => [filename, await fs.readFile(path.join(sessionRoot, filename), 'utf8')] as const));
  if (revision !== sessionRevision) return;
  await updateConnection(userId, { sessionData: encryptSecret(JSON.stringify(Object.fromEntries(entries))) });
}

function scheduleSessionPersist(userId: string, revision: number) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistQueue = persistQueue.then(() => persistSession(userId, revision)).catch((error) => {
      logger.error({ err: error }, 'falha ao salvar sessão do WhatsApp');
    });
  }, 400);
}

function clearPendingMessages(socket: any) {
  for (const [key, pending] of pendingConversations) {
    if (pending.socket !== socket) continue;
    clearTimeout(pending.timer);
    pendingConversations.delete(key);
  }
}

async function processIncomingBatch(userId: string, currentSocket: any, incoming: any[]) {
  if (sock !== currentSocket || incoming.length === 0) return;
  const lastMessage = incoming[incoming.length - 1];
  const jid = lastMessage.key.remoteJid;
  const phoneJid = [...incoming].reverse().map((msg) => msg.key.senderPn || msg.key.participantPn).find(Boolean)
    || (jid.endsWith('@s.whatsapp.net') ? jid : null);
  const phone = phoneJid?.split('@')[0];
  if (!phone) {
    logger.warn({ jid }, 'mensagens sem número de telefone resolvido');
    return;
  }

  const text = incoming.map((msg) => (
    msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || ''
  )).filter(Boolean).join('\n');
  const mediaMessage = [...incoming].reverse().find((msg) => msg.message?.imageMessage || msg.message?.audioMessage);
  let mediaData: { type: 'image' | 'audio'; base64: string; mimeType?: string } | undefined;
  if (mediaMessage?.message?.imageMessage) {
    const buffer = await downloadMediaMessage(mediaMessage, 'buffer', {});
    mediaData = { type: 'image', base64: buffer.toString('base64'), mimeType: mediaMessage.message.imageMessage.mimetype || 'image/jpeg' };
  } else if (mediaMessage?.message?.audioMessage) {
    const buffer = await downloadMediaMessage(mediaMessage, 'buffer', {});
    mediaData = { type: 'audio', base64: buffer.toString('base64'), mimeType: mediaMessage.message.audioMessage.mimetype || 'audio/ogg' };
  }
  if (!text && !mediaData) return;

  const legacyNumber = jid.endsWith('@lid') ? jid.split('@')[0] : undefined;
  const contactName = [...incoming].reverse().map((msg) => String(msg.pushName || '').trim()).find(Boolean) || undefined;
  let avatarUrl: string | undefined;
  try {
    avatarUrl = await currentSocket.profilePictureUrl(phoneJid || jid, 'preview');
  } catch {
    // Foto ausente ou protegida pelas configurações de privacidade do contato.
  }

  const ids = incoming.map((msg) => msg.key.id).filter(Boolean);
  const externalId = ids.length ? `batch:${ids.join(':')}` : undefined;
  const reply = await processIncomingMessage(userId, phone, text, mediaData, externalId, {
    name: contactName,
    avatarUrl,
    legacyNumber,
  });
  if (!reply || sock !== currentSocket) return;
  try {
    await currentSocket.readMessages(incoming.map((msg) => msg.key));
  } catch (error) {
    logger.warn({ err: error, messageIds: ids }, 'falha ao confirmar leitura');
  }
  await currentSocket.sendMessage(jid, { text: reply });
}

function queueIncomingMessage(userId: string, currentSocket: any, msg: any) {
  const key = `${userId}:${msg.key.remoteJid}`;
  const existing = pendingConversations.get(key);
  if (existing) clearTimeout(existing.timer);
  const messages = existing && existing.socket === currentSocket ? [...existing.messages, msg] : [msg];
  const timer = setTimeout(() => {
    pendingConversations.delete(key);
    processIncomingBatch(userId, currentSocket, messages).catch((error) => {
      logger.error({ err: error, messageIds: messages.map((item) => item.key.id) }, 'falha ao processar grupo de mensagens');
    });
  }, 5000);
  pendingConversations.set(key, { userId, socket: currentSocket, messages, timer });
}

async function resetSession(userId: string, logout: boolean) {
  sessionRevision += 1;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = null;
  const currentSocket = sock;
  sock = null;
  clearPendingMessages(currentSocket);
  if (currentSocket) {
    try {
      if (logout && currentSocket.user) await currentSocket.logout();
      else currentSocket.end(new Error('Sessão reiniciada'));
    } catch (error) {
      logger.warn({ err: error }, 'falha ao encerrar socket anterior');
    }
  }
  await fs.rm(sessionRoot, { recursive: true, force: true });
  await fs.mkdir(sessionRoot, { recursive: true });
  await updateConnection(userId, { status: 'disconnected', qrCode: null, phoneNumber: null, lastError: null, sessionData: null });
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
    try {
      await fs.mkdir(sessionRoot, { recursive: true });
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? error.code : undefined;
      if (code !== 'EACCES' && code !== 'EROFS') throw error;
      sessionRoot = path.resolve('/tmp/whatsapp-session');
      await fs.mkdir(sessionRoot, { recursive: true });
    }
    await restorePersistedSession(userId);
    const revision = sessionRevision;
    const { state, saveCreds } = await useMultiFileAuthState(sessionRoot);
    const persistentKeys = {
      get: state.keys.get.bind(state.keys),
      set: async (data: Parameters<typeof state.keys.set>[0]) => {
        await state.keys.set(data);
        scheduleSessionPersist(userId, revision);
      },
    };
    const { version } = await fetchLatestBaileysVersion();
    const currentSocket = makeWASocket({
      version,
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(persistentKeys, logger) },
      browser: Browsers.ubuntu('Chrome'), logger, generateHighQualityLinkPreview: false,
    });
    sock = currentSocket;
    currentSocket.ev.on('creds.update', async () => {
      await saveCreds();
      scheduleSessionPersist(userId, revision);
    });
    currentSocket.ev.on('connection.update', async ({ connection, lastDisconnect, qr }: any) => {
      if (sock !== currentSocket) return;
      if (qr) {
        const qrCode = await QRCode.toDataURL(qr);
        await updateConnection(userId, { status: 'qr', qrCode, lastError: null });
      }
      if (connection === 'open') {
        await persistSession(userId, revision);
        const phoneNumber = currentSocket.user?.id?.split(':')[0] || null;
        await updateConnection(userId, { status: 'connected', qrCode: null, phoneNumber, lastError: null });
      }
      if (connection === 'close') {
        const reason = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
        const reconnect = reason !== DisconnectReason.loggedOut;
        clearPendingMessages(currentSocket);
        sock = null;
        await updateConnection(userId, { status: 'disconnected', qrCode: null, lastError: reconnect ? 'Conexão interrompida; reconectando.' : null });
        if (reconnect) setTimeout(() => startSocket().catch(console.error), 3000);
      }
    });
    currentSocket.ev.on('messages.upsert', async ({ type, messages: incoming }: any) => {
      if (sock !== currentSocket) return;
      if (type !== 'notify') return;
      for (const msg of incoming) {
        if (msg.key.fromMe || !msg.key.remoteJid || isJidBroadcast(msg.key.remoteJid)) continue;
        queueIncomingMessage(userId, currentSocket, msg);
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
    await resetSession(userId, true);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error instanceof Error ? error.message : 'Falha ao desconectar' }); }
});
app.post('/refresh-qr', authorize, async (req, res) => {
  try {
    const userId = await resolveOwnerUserId();
    if (req.body.userId !== userId) return res.status(403).json({ error: 'Usuário inválido' });
    await resetSession(userId, false);
    await startSocket(userId);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error instanceof Error ? error.message : 'Falha ao gerar novo QR Code' }); }
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
    const connection = await db.query.whatsappConnections.findFirst({ where: eq(schema.whatsappConnections.userId, userId) });
    if (connection && ['connected', 'qr'].includes(connection.status)) startSocket(userId).catch(console.error);
  }).catch((error) => console.warn(error.message));
});
