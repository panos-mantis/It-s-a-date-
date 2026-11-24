import { rateLimit } from 'express-rate-limit';
import type { RequestHandler } from 'express';
import type { Env } from '../config/env.js';
import { AppError } from '../lib/errors.js';

/** A new limiter (and in-memory store) per call, so each app instance counts separately. */
export function authRateLimit(env: Env): RequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new AppError(429, 'RATE_LIMITED', 'Too many attempts. Try again in a few minutes.'));
    },
  });
}
