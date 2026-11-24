import { Router } from 'express';
import { paginationSchema } from '@itsadate/shared';
import type { Env } from '../../config/env.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { ideasController } from '../ideas/ideas.controller.js';

/** The signed-in user's own resources. */
export function meRoutes(env: Env): Router {
  const router = Router();
  router.get(
    '/ideas',
    requireAuth(env),
    validate({ query: paginationSchema }),
    ideasController.listMine,
  );
  return router;
}
