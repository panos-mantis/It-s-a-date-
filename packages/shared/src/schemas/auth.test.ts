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

describe('password byte limit', () => {
  const base = { name: 'Ana', email: 'a@x.com' };
  it('counts UTF-8 bytes', () => {
    expect(registerSchema.safeParse({ ...base, password: 'x'.repeat(72) }).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, password: 'x'.repeat(8) }).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, password: 'é'.repeat(37) }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: 'é'.repeat(36) }).success).toBe(true);
  });
});

describe('lenient login', () => {
  it('does not lock out legacy accounts', () => {
    expect(loginSchema.parse({ email: ' A@B ', password: 'x'.repeat(100) })).toEqual({
      email: 'a@b',
      password: 'x'.repeat(100),
    });
  });
  it('still requires values and bounds password', () => {
    expect(loginSchema.safeParse({ email: '', password: 'p' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b', password: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b', password: 'x'.repeat(1025) }).success).toBe(false);
  });
});
