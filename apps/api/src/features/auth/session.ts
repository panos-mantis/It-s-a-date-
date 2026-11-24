import type { Response } from 'express';
import jwt from 'jsonwebtoken';
import { ROLES, type Role } from '@itsadate/shared';
import type { Env } from '../../config/env.js';
import type { AuthContext } from '../../types/auth.js';

export const SESSION_COOKIE = 'itsadate_session';
const SESSION_DAYS = 7;

export function signSession(ctx: AuthContext, env: Env): string {
  return jwt.sign({ sub: ctx.userId, role: ctx.role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: `${SESSION_DAYS}d`,
  });
}

/** Returns the token claims, or null on any failure (bad signature, expired, wrong alg, bad shape). */
export function verifySession(token: string, env: Env): { sub: string; role: Role } | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string') return null;
    const { sub, role } = payload;
    if (typeof sub !== 'string' || !ROLES.includes(role as Role)) return null;
    return { sub, role: role as Role };
  } catch {
    return null;
  }
}

const cookieBase = (env: Env) =>
  ({
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
  }) as const;

export function setSessionCookie(res: Response, token: string, env: Env): void {
  res.cookie(SESSION_COOKIE, token, {
    ...cookieBase(env),
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response, env: Env): void {
  res.clearCookie(SESSION_COOKIE, cookieBase(env));
}
