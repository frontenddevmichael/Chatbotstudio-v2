import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseFAQFile } from '@/pages/builder/hooks/useFAQImport';
import { PLANS, isPremium, canCreateChatbot, hasReachedMessageLimit, isNearMessageLimit } from '@/lib/plans';
import { faqSchema, chatbotSchema } from '@/lib/validations';
import { sanitizeHTML, sanitizeText, sanitizeFAQ, isValidUrl } from '@/lib/sanitize';
import { getErrorMessage } from '@/lib/errors';
import { getDefaultFAQs, detectCategoryFromText, CATEGORIES } from '@/lib/default-faqs';

// ──────────────────────────────────────
// FAQ import parser (CSV, JSON, TSV, TXT)
// ──────────────────────────────────────
describe('parseFAQFile', () => {
  it('parses CSV with header row (question,answer)', async () => {
    const file = new File(['question,answer\nWhat is this?,This is a test\nHow are you?,I am fine'], 'test.csv', { type: 'text/csv' });
    const result = await parseFAQFile(file);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ question: 'What is this?', answer: 'This is a test' });
    expect(result[1]).toEqual({ question: 'How are you?', answer: 'I am fine' });
  });

  it('parses CSV with different column headers (title,response)', async () => {
    const file = new File(['title,response\nQ1?,A1\nQ2?,A2'], 'test.csv', { type: 'text/csv' });
    const result = await parseFAQFile(file);
    expect(result).toHaveLength(2);
  });

  it('parses CSV with quoted commas', async () => {
    const file = new File(['"question","answer"\n"What, is this?","This, is, the answer"'], 'test.csv', { type: 'text/csv' });
    const result = await parseFAQFile(file);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ question: 'What, is this?', answer: 'This, is, the answer' });
  });

  it('parses TSV with header row', async () => {
    const file = new File(['question\tanswer\nQ1\tA1\nQ2\tA2'], 'test.tsv', { type: 'text/tab-separated-values' });
    const result = await parseFAQFile(file);
    expect(result).toHaveLength(2);
  });

  it('parses JSON array format', async () => {
    const file = new File([JSON.stringify([{ question: 'Q1', answer: 'A1' }, { question: 'Q2', answer: 'A2' }])], 'test.json', { type: 'application/json' });
    const result = await parseFAQFile(file);
    expect(result).toHaveLength(2);
  });

  it('parses JSON with data wrapper', async () => {
    const file = new File([JSON.stringify({ faqs: [{ question: 'Q1', answer: 'A1' }] })], 'test.json', { type: 'application/json' });
    const result = await parseFAQFile(file);
    expect(result).toHaveLength(1);
  });

  it('parses TXT Q:/A: format', async () => {
    const file = new File(['Q: What is this?\nA: This is a test\nQ: How are you?\nA: I am fine'], 'test.txt', { type: 'text/plain' });
    const result = await parseFAQFile(file);
    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty file', async () => {
    const file = new File([''], 'empty.csv', { type: 'text/csv' });
    const result = await parseFAQFile(file);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for invalid JSON', async () => {
    const file = new File(['not json'], 'bad.json', { type: 'application/json' });
    const result = await parseFAQFile(file);
    expect(result).toHaveLength(0);
  });

  it('handles Intercom-style export (title,answer)', async () => {
    const csv = 'title,answer\n"Where are you located?","123 Main St"\n"What are your hours?","9-5 M-F"';
    const file = new File([csv], 'intercom.csv', { type: 'text/csv' });
    const result = await parseFAQFile(file);
    expect(result).toHaveLength(2);
  });

  it('handles Tidio-style export (question,response)', async () => {
    const csv = 'question,response\n"Q?","A"';
    const file = new File([csv], 'tidio.csv', { type: 'text/csv' });
    const result = await parseFAQFile(file);
    expect(result).toHaveLength(1);
  });
});

// ──────────────────────────────────────
// Plans helpers
// ──────────────────────────────────────
describe('plans helpers', () => {
  const freeProfile = { id: '1', plan: 'free', message_limit: 500, monthly_message_count: 0 } as any;
  const premiumProfile = { id: '2', plan: 'premium', message_limit: 10000, monthly_message_count: 0 } as any;

  it('isPremium returns true for premium', () => {
    expect(isPremium(premiumProfile)).toBe(true);
    expect(isPremium(freeProfile)).toBe(false);
    expect(isPremium(null)).toBe(false);
  });

  it('canCreateChatbot respects plan limits', () => {
    expect(canCreateChatbot(freeProfile, 0)).toBe(true);
    expect(canCreateChatbot(freeProfile, 1)).toBe(false);
    expect(canCreateChatbot(premiumProfile, 5)).toBe(true);
    expect(canCreateChatbot(premiumProfile, 10)).toBe(false);
  });

  it('hasReachedMessageLimit works correctly', () => {
    const atLimit = { ...freeProfile, monthly_message_count: 500 };
    const underLimit = { ...freeProfile, monthly_message_count: 250 };
    expect(hasReachedMessageLimit(atLimit)).toBe(true);
    expect(hasReachedMessageLimit(underLimit)).toBe(false);
    expect(hasReachedMessageLimit(null)).toBe(false);
  });

  it('isNearMessageLimit returns true at 80-99%', () => {
    expect(isNearMessageLimit({ ...freeProfile, monthly_message_count: 400 })).toBe(true);
    expect(isNearMessageLimit({ ...freeProfile, monthly_message_count: 499 })).toBe(true);
    expect(isNearMessageLimit({ ...freeProfile, monthly_message_count: 300 })).toBe(false);
    expect(isNearMessageLimit({ ...freeProfile, monthly_message_count: 500 })).toBe(false);
  });
});

// ──────────────────────────────────────
// Zod validations
// ──────────────────────────────────────
describe('validations', () => {
  it('faqSchema accepts valid input', () => {
    expect(faqSchema.safeParse({ question: 'Test?', answer: 'Answer' }).success).toBe(true);
  });

  it('faqSchema rejects empty question', () => {
    expect(faqSchema.safeParse({ question: '', answer: 'Answer' }).success).toBe(false);
  });

  it('faqSchema rejects long question (>200 chars)', () => {
    expect(faqSchema.safeParse({ question: 'x'.repeat(201), answer: 'A' }).success).toBe(false);
  });

  it('faqSchema rejects long answer (>2000 chars)', () => {
    expect(faqSchema.safeParse({ question: 'Q?', answer: 'x'.repeat(2001) }).success).toBe(false);
  });

  it('chatbotSchema accepts valid name', () => {
    expect(chatbotSchema.safeParse({ name: 'My Bot', tone: 'friendly', welcome_message: 'Hi!' }).success).toBe(true);
  });

  it('chatbotSchema rejects empty name', () => {
    expect(chatbotSchema.safeParse({ name: '', tone: 'friendly' }).success).toBe(false);
  });

  it('chatbotSchema rejects long name (>50 chars)', () => {
    expect(chatbotSchema.safeParse({ name: 'x'.repeat(51), tone: 'friendly' }).success).toBe(false);
  });

  it('chatbotSchema rejects invalid tone', () => {
    expect(chatbotSchema.safeParse({ name: 'Bot', tone: 'aggressive' }).success).toBe(false);
  });
});

// ──────────────────────────────────────
// Sanitize utilities
// ──────────────────────────────────────
describe('sanitize utilities', () => {
  it('sanitizeHTML strips script tags', () => {
    expect(sanitizeHTML('<script>alert("xss")</script>Hello')).not.toContain('<script>');
  });

  it('sanitizeHTML allows safe HTML', () => {
    expect(sanitizeHTML('<b>Hello</b>')).toContain('<b>');
  });

  it('sanitizeText strips HTML', () => {
    expect(sanitizeText('<script>alert(1)</script>Hello')).toBe('Hello');
  });

  it('sanitizeText trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('sanitizeText limits length', () => {
    expect(sanitizeText('x'.repeat(5000))).toHaveLength(2000);
  });

  it('isValidUrl rejects javascript: URLs', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
  });

  it('isValidUrl accepts valid URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://example.com/path?q=1')).toBe(true);
  });

  it('isValidUrl rejects empty strings', () => {
    expect(isValidUrl('')).toBe(false);
  });
});

// ──────────────────────────────────────
// Default FAQs
// ──────────────────────────────────────
describe('default-faqs', () => {
  it('has 9 categories', () => {
    expect(CATEGORIES).toHaveLength(9);
  });

  it('each category has 5 FAQ pairs', () => {
    for (const cat of CATEGORIES) {
      const faqs = getDefaultFAQs(cat.id);
      expect(faqs).toHaveLength(5);
    }
  });

  it('detectCategoryFromText identifies plumber keywords', () => {
    const result = detectCategoryFromText('We fix pipes and do plumbing repairs');
    expect(result).toBe('plumber');
  });

  it('detectCategoryFromText identifies salon keywords', () => {
    const result = detectCategoryFromText('Haircuts, styling, and beauty salon');
    expect(result).toBe('salon');
  });

  it('detectCategoryFromText returns null for unrecognized text', () => {
    const result = detectCategoryFromText('Some random text about nothing');
    expect(result).toBeNull();
  });
});

// ──────────────────────────────────────
// Error message utility
// ──────────────────────────────────────
describe('getErrorMessage', () => {
  it('returns string messages directly', () => {
    expect(getErrorMessage('Something broke')).toBe('Something broke');
  });

  it('extracts Error.message', () => {
    expect(getErrorMessage(new Error('Broken'))).toBe('Broken');
  });

  it('handles Supabase error objects', () => {
    expect(getErrorMessage({ message: 'DB error' })).toBe('DB error');
    expect(getErrorMessage({ error: 'Auth error' })).toBe('Auth error');
    expect(getErrorMessage({ error_description: 'Bad token' })).toBe('Bad token');
  });

  it('returns fallback for unknown types', () => {
    expect(getErrorMessage(null)).toBe('Something went wrong');
    expect(getErrorMessage(undefined)).toBe('Something went wrong');
    expect(getErrorMessage(42)).toBe('Something went wrong');
  });
});
