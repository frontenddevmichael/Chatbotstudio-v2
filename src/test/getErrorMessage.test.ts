import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '@/lib/errors';

describe('getErrorMessage', () => {
  it('returns Error.message for Error instances', () => {
    expect(getErrorMessage(new Error('Something broke'), 'fallback')).toBe('Something broke');
  });

  it('returns the string itself for string input', () => {
    expect(getErrorMessage('raw string', 'fallback')).toBe('raw string');
  });

  it('extracts .message from plain objects with string message', () => {
    expect(getErrorMessage({ message: 'object message' }, 'fallback')).toBe('object message');
  });

  it('extracts .error from plain objects with string error', () => {
    expect(getErrorMessage({ error: 'object error' }, 'fallback')).toBe('object error');
  });

  it('prefers .message over .error when both exist', () => {
    expect(getErrorMessage({ message: 'msg', error: 'err' }, 'fallback')).toBe('msg');
  });

  it('returns fallback for null', () => {
    expect(getErrorMessage(null, 'my fallback')).toBe('my fallback');
  });

  it('returns fallback for undefined', () => {
    expect(getErrorMessage(undefined, 'my fallback')).toBe('my fallback');
  });

  it('returns fallback for a number', () => {
    expect(getErrorMessage(42, 'my fallback')).toBe('my fallback');
  });

  it('returns fallback for empty object', () => {
    expect(getErrorMessage({}, 'my fallback')).toBe('my fallback');
  });

  it('returns fallback for object with non-string message', () => {
    expect(getErrorMessage({ message: {} }, 'my fallback')).toBe('my fallback');
  });

  it('returns fallback for array', () => {
    expect(getErrorMessage(['error msg'], 'my fallback')).toBe('my fallback');
  });

  it('handles AuthApiError-like shape', () => {
    const authErr = { name: 'AuthApiError', message: 'Invalid login credentials', status: 400 };
    expect(getErrorMessage(authErr, 'fb')).toBe('Invalid login credentials');
  });

  it('returns fallback when string error is "{}"', () => {
    expect(getErrorMessage('{}', 'fallback text')).toBe('fallback text');
  });

  it('returns fallback when Error.message is "{}"', () => {
    expect(getErrorMessage(new Error('{}'), 'fallback text')).toBe('fallback text');
  });

  it('returns fallback when object.message is "{}"', () => {
    expect(getErrorMessage({ message: '{}' }, 'fallback text')).toBe('fallback text');
  });

  it('returns fallback when object.error is "{}"', () => {
    expect(getErrorMessage({ error: '{}' }, 'fallback text')).toBe('fallback text');
  });
});
