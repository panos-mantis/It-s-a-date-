import type { RequestHandler } from 'express';
import type { IdeaQuery } from '@itsadate/shared';
import { ideasService } from './ideas.service.js';

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
};
