import { describe, expect, it } from 'vitest';
import { validateEmail, validateMinLength, validatePasswordMin } from './validation';

describe('validation helpers', () => {
  it('validates trimmed work email format', () => {
    expect(validateEmail('')).toBe('Please enter a valid work email address.');
    expect(validateEmail('not-an-email')).toBe('Please enter a valid work email address.');
    expect(validateEmail('  alex@example.test  ')).toBeNull();
  });

  it('validates minimum trimmed string length and raw password length', () => {
    expect(validateMinLength('  a ', 2, 'Too short')).toBe('Too short');
    expect(validateMinLength(' ab ', 2, 'Too short')).toBeNull();

    expect(validatePasswordMin('12345', 6, 'Min 6 chars')).toBe('Min 6 chars');
    expect(validatePasswordMin('123456', 6, 'Min 6 chars')).toBeNull();
  });
});
