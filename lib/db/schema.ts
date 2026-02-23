import { pgTable, text, timestamp, integer, doublePrecision, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    clerkUserId: text('clerk_user_id').unique().notNull(),
    email: text('email').notNull(),
    name: text('name'),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at'),
});

export const leads = pgTable('leads', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    company: text('company'),

    estimatedValue: doublePrecision('estimated_value').default(0),
    status: text('status').default('novo'),
    temperature: text('temperature').default('frio'), // frio, morno, quente

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
});

export const activities = pgTable('activities', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),

    type: text('type').notNull(),
    content: text('content'),
    metadata: text('metadata'), // JSON stringified

    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const agents = pgTable('agents', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    personality: text('personality').notNull(),
    provider: text('provider').notNull(), // 'openai', 'groq', 'gemini'
    model: text('model'),
    apiKey: text('api_key'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const whatsappConnections = pgTable('whatsapp_connections', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('disconnected'), // 'disconnected', 'qr', 'connected'
    sessionData: text('session_data'), // JSON string with auth info
    qrCode: text('qr_code'),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
