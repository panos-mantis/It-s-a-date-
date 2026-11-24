import type { RequestHandler } from 'express';
import type { TagCreateInput, TagUpdateInput } from '@itsadate/shared';
import { toTagDTO } from './tags.mapper.js';
import { tagsService } from './tags.service.js';

const idOf = (res: Parameters<RequestHandler>[1]) =>
  (res.locals.validated.params as { id: string }).id;

export const tagsController = {
  list: (async (_req, res) => {
    res.json((await tagsService.list()).map(toTagDTO));
  }) as RequestHandler,

  create: (async (_req, res) => {
    const tag = await tagsService.create(res.locals.validated.body as TagCreateInput);
    res.status(201).json(toTagDTO(tag));
  }) as RequestHandler,

  update: (async (_req, res) => {
    const tag = await tagsService.update(idOf(res), res.locals.validated.body as TagUpdateInput);
    res.json(toTagDTO(tag));
  }) as RequestHandler,

  remove: (async (_req, res) => {
    await tagsService.remove(idOf(res));
    res.status(204).end();
  }) as RequestHandler,
};
