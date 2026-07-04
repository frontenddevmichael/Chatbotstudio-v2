import DOMPurify from 'dompurify';

export const sanitizeHTML = (dirty: string): string =>
  DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'ol', 'li', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });

export const sanitizeText = (str: string | null | undefined): string => {
  if (!str) return '';
  const noTags = str
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
  return noTags.length > 2000 ? noTags.slice(0, 2000) : noTags;
};

export const sanitizeFAQ = (faq: { question: string; answer: string }) => ({
  ...faq,
  question: sanitizeText(faq.question),
  answer: sanitizeText(faq.answer),
});

export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'ftp:', 'mailto:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};
