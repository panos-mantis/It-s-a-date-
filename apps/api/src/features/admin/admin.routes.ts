import { Router } from 'express';
import type { Env } from '../../config/env.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { adminTagsRoutes } from '../tags/tags.routes.js';

/** Everything under /api/v1/admin requires an admin session. */
export function adminRoutes(env: Env): Router {
  const router = Router();
  router.use(requireAuth(env), requireRole('admin'));
  router.use('/tags', adminTagsRoutes());
  return router;
}
