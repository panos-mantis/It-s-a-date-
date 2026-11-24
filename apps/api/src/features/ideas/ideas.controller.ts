import type { RequestHandler } from 'express';
import type { IdeaCreateInput, IdeaQuery } from '@itsadate/shared';
import type { Env } from '../../config/env.js';
import { unauthorized } from '../../lib/errors.js';
import { ideasService } from './ideas.service.js';

/** Behind requireAuth the viewer is always set; this narrows the type. */
const authedOf = (res: Parameters<RequestHandler>[1]) => {
  if (!res.locals.auth) throw unauthorized();
  return res.locals.auth;
};
const viewerOf = (res: Parameters<RequestHandler>[1]) => res.locals.auth;

export const ideasController = {
  list: (async (_req, res) => {
    const query = res.locals.validated.query as IdeaQuery;
    res.json(await ideasService.listApproved(query, viewerOf(res)));
  }) as RequestHandler,

  get: (async (_req, res) => {
    const { id } = res.locals.validated.params as { id: string };
    res.json(await ideasService.getVisible(id, viewerOf(res)));
  }) as RequestHandler,

  create: (env: Env) =>
    (async (_req, res) => {
      const body = res.locals.validated.body as IdeaCreateInput;
      res.status(201).json(await ideasService.create(body, authedOf(res), env));
    }) as RequestHandler,

  listMine: (async (_req, res) => {
    const page = res.locals.validated.query as { page: number; pageSize: number };
    res.json(await ideasService.listMine(page, authedOf(res)));
  }) as RequestHandler,
};
