import { Router } from 'express';
import { loginSchema, registerSchema } from '@itsadate/shared';
import type { Env } from '../../config/env.js';
import { requireAuth } from '../../middleware/auth.js';
import { authRateLimit } from '../../middleware/rate-limit.js';
import { validate } from '../../middleware/validate.js';
import { authController } from './auth.controller.js';

export function authRoutes(env: Env): Router {
  const router = Router();
  const c = authController(env);
  const limiter = authRateLimit(env);

  router.post('/register', limiter, validate({ body: registerSchema }), c.register);
  router.post('/login', limiter, validate({ body: loginSchema }), c.login);
  router.post('/logout', c.logout);
  router.get('/me', requireAuth(env), c.me);
  return router;
}
