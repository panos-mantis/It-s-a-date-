import type { Request, RequestHandler, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import type { Role } from '@itsadate/shared';
import type { Env } from '../config/env.js';
import { SESSION_COOKIE, verifySession } from '../features/auth/session.js';
import { usersRepository } from '../features/users/users.repository.js';
import { forbidden, unauthorized } from '../lib/errors.js';
import type { UserDoc } from '../models/user.js';

/**
 * Resolves the cookie to a live user; the role comes from the DB, not the token.
 * Only a bad token or id yields null; DB failures propagate to the error handler.
 */
async function resolve(req: Request, env: Env): Promise<UserDoc | null> {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== 'string' || token === '') return null;
  const claims = verifySession(token, env);
  if (!claims || !isValidObjectId(claims.sub)) return null;
  return usersRepository.findById(claims.sub);
}

function attach(res: Response, user: UserDoc): void {
  res.locals.auth = { userId: user.id as string, role: user.role };
  res.locals.user = user;
}

export function requireAuth(env: Env): RequestHandler {
  return async (req, res, next) => {
    const user = await resolve(req, env);
    if (!user) {
      next(unauthorized());
      return;
    }
    attach(res, user);
    next();
  };
}

export function optionalAuth(env: Env): RequestHandler {
  return async (req, res, next) => {
    const user = await resolve(req, env);
    if (user) attach(res, user);
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
