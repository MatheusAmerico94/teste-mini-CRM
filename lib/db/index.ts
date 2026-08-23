import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const rawUrl = process.env.DATABASE_URL;
function validDatabaseUrl(value?: string) {
  if (!value || /placeholder|user:password|host:port|db_name/i.test(value)) return false;
  try { const url = new URL(value); return ['postgres:', 'postgresql:'].includes(url.protocol); }
  catch { return false; }
}
const configuredUrl = validDatabaseUrl(rawUrl) ? rawUrl : undefined;
const connectionString = configuredUrl
  ? configuredUrl
  : 'postgresql://invalid:invalid@127.0.0.1:5432/invalid';

if (!configuredUrl && process.env.NODE_ENV !== 'production') {
  console.warn('DATABASE_URL ausente; operações de banco falharão até a configuração ser preenchida.');
}

const queryClient = postgres(connectionString, {
  ssl: configuredUrl ? 'require' : false,
  prepare: false,
  connect_timeout: 10,
  max: 5,
});

export const db = drizzle(queryClient, { schema });
