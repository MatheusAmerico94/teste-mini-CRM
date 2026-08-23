import { z } from 'zod';
import { LEAD_STATUSES } from './crm';

export const leadStatusSchema = z.enum(LEAD_STATUSES.map(({ id }) => id) as [string, ...string[]]);

export const agentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  personality: z.string().trim().min(20).max(20000),
  provider: z.literal('openai').default('openai'),
  model: z.string().trim().min(1).max(80).default('gpt-4o-mini'),
  apiKey: z.string().trim().max(300).optional(),
  isActive: z.boolean().default(true),
});

export const businessSettingsSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  pixKey: z.string().trim().max(200).optional(),
  pixRecipient: z.string().trim().max(120).optional(),
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
  isActive: z.boolean().default(true),
});
