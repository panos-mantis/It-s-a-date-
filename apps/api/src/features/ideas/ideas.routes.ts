import { Router } from 'express';
import { idParamsSchema, ideaCreateSchema, ideaQuerySchema } from '@itsadate/shared';
import type { Env } from '../../config/env.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { ideasController as c } from './ideas.controller.js';

export function ideasRoutes(env: Env): Router {
  const router = Router();
  router.get('/', optionalAuth(env), validate({ query: ideaQuerySchema }), c.list);
  router.post('/', requireAuth(env), validate({ body: ideaCreateSchema }), c.create(env));
  router.get('/:id', optionalAuth(env), validate({ params: idParamsSchema }), c.get);
  return router;
}
