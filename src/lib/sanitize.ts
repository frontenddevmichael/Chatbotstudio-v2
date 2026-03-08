import DOMPurify from 'dompurify';

export const sanitizeHTML = (dirty: string): string =>
  DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'ol', 'li', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });

export const sanitizeText = (str: string | null | undefined): string =>
  str?.replace(/<[^>]*>/g, '').trim() ?? '';

export const sanitizeFAQ = (faq: { question: string; answer: string }) => ({
  ...faq,
  question: sanitizeText(faq.question),
  answer: sanitizeText(faq.answer),
});

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
