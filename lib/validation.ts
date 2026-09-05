import { z } from 'zod';
import { LEAD_STATUSES } from './crm';

export const leadStatusSchema = z.enum(LEAD_STATUSES.map(({ id }) => id) as [string, ...string[]]);

export const agentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  personality: z.string().trim().min(20).max(40000),
  provider: z.literal('openai').default('openai'),
  model: z.string().trim().min(1).max(80).default('gpt-4o-mini'),
  apiKey: z.string().trim().max(300).optional(),
  responseTemperature: z.coerce.number().min(0).max(2).default(0.7),
  isActive: z.boolean().default(true),
  role: z.enum(['router', 'specialist']).default('specialist'),
  serviceKey: z.enum(['general', 'photos', 'sites']).default('general'),
});

export const prospectSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  contactName: z.string().trim().max(160).optional(),
  phone: z.string().trim().min(8).max(40),
  city: z.string().trim().max(120).optional(),
  niche: z.string().trim().max(120).optional(),
  websiteUrl: z.string().trim().max(500).optional(),
  websiteStatus: z.enum(['has_site', 'no_site', 'unknown']).default('unknown'),
  websiteNotes: z.string().trim().max(2000).optional(),
  personalizedMessage: z.string().trim().min(10).max(4000),
  contactApproved: z.boolean().default(false),
});

export const businessSettingsSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  pixKey: z.string().trim().max(200).optional(),
  pixRecipient: z.string().trim().max(120).optional(),
  pixInstitution: z.string().trim().max(120).optional(),
  defaultGreeting: z.string().trim().max(1000).optional(),
  salesInstructions: z.string().trim().max(6000).optional(),
  paymentInstructions: z.string().trim().max(1500).optional(),
  humanHandoffMessage: z.string().trim().max(1000).optional(),
});

export const packageSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional(),
  price: z.coerce.number().min(0).max(1000000),
  imageCount: z.coerce.number().int().min(1).max(1000),
  deliveryDays: z.coerce.number().int().min(0).max(365),
  deliveryHours: z.coerce.number().int().min(1).max(720).optional().default(2),
  isActive: z.boolean().default(true),
});
