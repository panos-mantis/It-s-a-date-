import { Router } from 'express';
import {
  adminIdeaQuerySchema,
  adminUserQuerySchema,
  idParamsSchema,
  ideaUpdateSchema,
  roleUpdateSchema,
} from '@itsadate/shared';
import type { Env } from '../../config/env.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { adminTagsRoutes } from '../tags/tags.routes.js';
import { adminIdeasController as ideas } from './admin-ideas.controller.js';
import { adminUsersController as users } from './admin-users.controller.js';

/** Everything under /api/v1/admin requires an admin session. */
export function adminRoutes(env: Env): Router {
  const router = Router();
  router.use(requireAuth(env), requireRole('admin'));
  router.use('/tags', adminTagsRoutes());

  router.get('/ideas', validate({ query: adminIdeaQuerySchema }), ideas.list);
  router.patch(
    '/ideas/:id',
    validate({ params: idParamsSchema, body: ideaUpdateSchema }),
    ideas.update(env),
  );
  router.delete('/ideas/:id', validate({ params: idParamsSchema }), ideas.remove);

  router.get('/users', validate({ query: adminUserQuerySchema }), users.list);
  router.post(
    '/users/:id/role',
    validate({ params: idParamsSchema, body: roleUpdateSchema }),
    users.setRole,
  );
  return router;
}
