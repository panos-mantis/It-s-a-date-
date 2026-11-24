import type { RequestHandler } from 'express';
import type { AdminUserQuery, RoleUpdateInput } from '@itsadate/shared';
import { adminUsersService } from './admin-users.service.js';

export const adminUsersController = {
  list: (async (_req, res) => {
    res.json(await adminUsersService.list(res.locals.validated.query as AdminUserQuery));
  }) as RequestHandler,

  setRole: (async (_req, res) => {
    const { id } = res.locals.validated.params as { id: string };
    const { role } = res.locals.validated.body as RoleUpdateInput;
    res.json(await adminUsersService.setRole(id, role));
  }) as RequestHandler,
};
