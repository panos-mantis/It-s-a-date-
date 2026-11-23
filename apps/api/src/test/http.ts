import type { Response } from 'supertest';
import type { ApiErrorBody } from '@itsadate/shared';

/** The typed `error` object of an API error response. */
export const errorOf = (res: Response): ApiErrorBody['error'] => (res.body as ApiErrorBody).error;

/** The `res.locals.validated` echo used by validate tests. */
export const validatedOf = (res: Response) =>
  res.body as { body?: unknown; query?: unknown; params?: unknown };
