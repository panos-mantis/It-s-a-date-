import { Router } from 'express';
import { idParamsSchema, tagCreateSchema, tagUpdateSchema } from '@itsadate/shared';
import { validate } from '../../middleware/validate.js';
import { tagsController as c } from './tags.controller.js';

/** Public: GET /tags. */
export function tagsRoutes(): Router {
  const router = Router();
  router.get('/', c.list);
  return router;
}

/** Admin tag routes, mounted under the guarded admin router. */
export function adminTagsRoutes(): Router {
  const router = Router();
  router.post('/', validate({ body: tagCreateSchema }), c.create);
  router.patch('/:id', validate({ params: idParamsSchema, body: tagUpdateSchema }), c.update);
  router.delete('/:id', validate({ params: idParamsSchema }), c.remove);
  return router;
}
