import { pgTable, text, timestamp, integer, doublePrecision, boolean, uniqueIndex } from 'drizzle-orm/pg-core';

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
    avatarUrl: text('avatar_url'),
    company: text('company'),

    estimatedValue: doublePrecision('estimated_value').default(0),
    status: text('status').default('novo'),
    temperature: text('temperature').default('frio'), // frio, morno, quente
    aiEnabled: boolean('ai_enabled').notNull().default(true),
    source: text('source').default('whatsapp'),
    notes: text('notes'),
    paidAt: timestamp('paid_at'),
    handoffAt: timestamp('handoff_at'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    persistentMemory: text('persistent_memory'), // JSON string with user facts
    serviceKey: text('service_key').notNull().default('general'), // general, photos, sites
    assignedAgentId: text('assigned_agent_id'),
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
    provider: text('provider').notNull().default('openai'),
    model: text('model'),
    apiKey: text('api_key'),
    responseTemperature: doublePrecision('response_temperature').notNull().default(0.7),
    isActive: boolean('is_active').default(true),
    role: text('role').notNull().default('specialist'), // router or specialist
    serviceKey: text('service_key').notNull().default('general'), // general, photos, sites
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const prospects = pgTable('prospects', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    leadId: text('lead_id').references(() => leads.id, { onDelete: 'set null' }),
    businessName: text('business_name').notNull(),
    contactName: text('contact_name'),
    phone: text('phone').notNull(),
    city: text('city'),
    niche: text('niche'),
    websiteUrl: text('website_url'),
    websiteStatus: text('website_status').notNull().default('unknown'),
    websiteNotes: text('website_notes'),
    personalizedMessage: text('personalized_message').notNull(),
    status: text('status').notNull().default('draft'),
    contactApproved: boolean('contact_approved').notNull().default(false),
    lastContactedAt: timestamp('last_contacted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
    userPhoneUnique: uniqueIndex('prospects_user_phone_unique').on(table.userId, table.phone),
}));

export const whatsappConnections = pgTable('whatsapp_connections', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('disconnected'), // 'disconnected', 'qr', 'connected'
    sessionData: text('session_data'), // reservado para metadados, nunca para credenciais Baileys
    qrCode: text('qr_code'),
    phoneNumber: text('phone_number'),
    lastError: text('last_error'),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
    userUnique: uniqueIndex('whatsapp_connections_user_unique').on(table.userId),
}));

export const messages = pgTable('messages', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'user' (lead) or 'assistant'
    content: text('content').notNull(),
    externalId: text('external_id'),
    messageType: text('message_type').notNull().default('text'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
    externalIdUnique: uniqueIndex('messages_external_id_unique').on(table.externalId),
}));

export const businessSettings = pgTable('business_settings', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    businessName: text('business_name').notNull().default('Estúdio de Ensaios com IA'),
    pixKey: text('pix_key'),
    pixRecipient: text('pix_recipient'),
    defaultGreeting: text('default_greeting'),
    salesInstructions: text('sales_instructions'),
    paymentInstructions: text('payment_instructions'),
    humanHandoffMessage: text('human_handoff_message'),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
    userUnique: uniqueIndex('business_settings_user_unique').on(table.userId),
}));

export const servicePackages = pgTable('service_packages', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    price: doublePrecision('price').notNull().default(0),
    imageCount: integer('image_count').notNull().default(1),
    deliveryDays: integer('delivery_days').notNull().default(3),
    deliveryHours: integer('delivery_hours'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const portfolioItems = pgTable('portfolio_items', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    category: text('category'),
    mediaUrl: text('media_url').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});
