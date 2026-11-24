import type { RequestHandler } from 'express';
import type { AdminIdeaQuery, IdeaUpdateInput } from '@itsadate/shared';
import type { Env } from '../../config/env.js';
import { unauthorized } from '../../lib/errors.js';
import { adminIdeasService } from './admin-ideas.service.js';

const idOf = (res: Parameters<RequestHandler>[1]) =>
  (res.locals.validated.params as { id: string }).id;

/** Behind requireAuth the admin is always set; this narrows the type. */
const authedOf = (res: Parameters<RequestHandler>[1]) => {
  if (!res.locals.auth) throw unauthorized();
  return res.locals.auth;
};

export const adminIdeasController = {
  list: (async (_req, res) => {
    const query = res.locals.validated.query as AdminIdeaQuery;
    res.json(await adminIdeasService.list(query, authedOf(res)));
  }) as RequestHandler,

  update: (env: Env) =>
    (async (_req, res) => {
      const body = res.locals.validated.body as IdeaUpdateInput;
      res.json(await adminIdeasService.update(idOf(res), body, authedOf(res), env));
    }) as RequestHandler,

  remove: (async (_req, res) => {
    await adminIdeasService.remove(idOf(res));
    res.status(204).end();
  }) as RequestHandler,
};
