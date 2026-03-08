import { z } from 'zod';

export const chatbotNameSchema = z.string().trim().min(1, 'Name is required').max(100, 'Name must be under 100 characters');

export const chatbotSchema = z.object({
  name: chatbotNameSchema,
  welcome_message: z.string().max(500, 'Welcome message must be under 500 characters').optional(),
  tone: z.enum(['friendly', 'professional', 'casual', 'formal']).optional(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').optional(),
  avatar_emoji: z.string().max(50).optional(),
});

export const faqSchema = z.object({
  question: z.string().trim().min(1, 'Question is required').max(500, 'Question must be under 500 characters'),
  answer: z.string().trim().min(1, 'Answer is required').max(2000, 'Answer must be under 2000 characters'),
});

export const faqListSchema = z.array(faqSchema);
