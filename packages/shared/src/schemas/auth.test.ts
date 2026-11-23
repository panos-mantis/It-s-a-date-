import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './auth.js';

describe('auth schemas', () => {
  it('normalizes registration input', () => {
    expect(
      registerSchema.parse({ name: ' Ana ', email: ' Ana@X.com ', password: '12345678' }),
    ).toEqual({ name: 'Ana', email: 'ana@x.com', password: '12345678' });
  });
  it('bounds the password length', () => {
    expect(
      registerSchema.safeParse({ name: 'Ana', email: 'a@x.com', password: 'x'.repeat(73) }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ name: 'Ana', email: 'a@x.com', password: '1234567' }).success,
    ).toBe(false);
  });
  it('normalizes login email', () => {
    expect(loginSchema.parse({ email: ' Ana@X.com ', password: 'p' })).toEqual({
      email: 'ana@x.com',
      password: 'p',
    });
    expect(loginSchema.safeParse({ email: 'a@x.com', password: '' }).success).toBe(false);
  });
});
