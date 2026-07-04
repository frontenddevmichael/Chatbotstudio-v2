export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err == null) return fallback;
  if (err instanceof Error) {
    if (err.message === '{}') return fallback;
    return err.message;
  }
  if (typeof err === 'string') {
    if (err === '{}') return fallback;
    return err;
  }
  if (typeof err === 'number') return fallback;
  if (typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === 'string' && obj.message !== '{}') return obj.message;
    if (typeof obj.error === 'string' && obj.error !== '{}') return obj.error;
    if (typeof obj.error_description === 'string' && obj.error_description !== '{}') return obj.error_description;
  }
  return fallback;
}
