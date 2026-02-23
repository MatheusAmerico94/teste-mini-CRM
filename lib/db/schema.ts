import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    clerkUserId: text('clerk_user_id').unique().notNull(),
    email: text('email').notNull(),
    name: text('name'),
    avatarUrl: text('avatar_url'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }),
});

export const leads = sqliteTable('leads', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    company: text('company'),

    estimatedValue: real('estimated_value').default(0),
    status: text('status').default('novo'),
    temperature: text('temperature').default('frio'), // frio, morno, quente

    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export const activities = sqliteTable('activities', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),

    type: text('type').notNull(),
    content: text('content'),
    metadata: text('metadata'), // JSON stringified

    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const agents = sqliteTable('agents', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    personality: text('personality').notNull(),
    provider: text('provider').notNull(), // 'openai', 'groq', 'gemini'
    model: text('model'),
    apiKey: text('api_key'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const whatsappConnections = sqliteTable('whatsapp_connections', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('disconnected'), // 'disconnected', 'qr', 'connected'
    sessionData: text('session_data'), // JSON string with auth info
    qrCode: text('qr_code'),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
