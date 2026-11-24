import type { Request, RequestHandler } from 'express';
import type { Role } from '@itsadate/shared';
import type { Env } from '../config/env.js';
import { SESSION_COOKIE, verifySession } from '../features/auth/session.js';
import { usersRepository } from '../features/users/users.repository.js';
import { forbidden, unauthorized } from '../lib/errors.js';
import type { AuthContext } from '../types/auth.js';

/** Resolves the cookie to a live user; the role comes from the DB, not the token. */
async function resolve(req: Request, env: Env): Promise<AuthContext | null> {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== 'string' || token === '') return null;
  const claims = verifySession(token, env);
  if (!claims) return null;
  try {
    const user = await usersRepository.findById(claims.sub);
    return user ? { userId: user.id as string, role: user.role } : null;
  } catch {
    return null; // e.g. malformed id
  }
}

export function requireAuth(env: Env): RequestHandler {
  return async (req, res, next) => {
    const auth = await resolve(req, env);
    if (!auth) {
      next(unauthorized());
      return;
    }
    res.locals.auth = auth;
    next();
  };
}

export function optionalAuth(env: Env): RequestHandler {
  return async (req, res, next) => {
    const auth = await resolve(req, env);
    if (auth) res.locals.auth = auth;
    next();
  };
}

/** Must follow requireAuth. */
export function requireRole(role: Role): RequestHandler {
  return (_req, res, next) => {
    if (res.locals.auth?.role !== role) {
      next(forbidden());
      return;
    }
    next();
  };
}
