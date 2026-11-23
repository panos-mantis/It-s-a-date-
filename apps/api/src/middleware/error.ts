import type { ErrorRequestHandler } from 'express';
import type { ApiErrorBody } from '@itsadate/shared';
import { AppError } from '../lib/errors.js';

function send(
  res: Parameters<ErrorRequestHandler>[2],
  status: number,
  error: ApiErrorBody['error'],
) {
  const body: ApiErrorBody = { error };
  res.status(status).json(body);
}

export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    send(res, err.status, {
      code: err.code,
      message: err.message,
      ...(err.details === undefined ? {} : { details: err.details }),
    });
    return;
  }

  const e = (err ?? {}) as { type?: string; name?: string; code?: unknown };
  if (e.type === 'entity.parse.failed') {
    send(res, 400, { code: 'BAD_REQUEST', message: 'Malformed JSON' });
    return;
  }
  if (e.type === 'entity.too.large') {
    send(res, 413, { code: 'BAD_REQUEST', message: 'Request body too large' });
    return;
  }
  if (e.name === 'CastError') {
    send(res, 400, { code: 'BAD_REQUEST', message: 'Invalid value' });
    return;
  }
  if (e.code === 11000) {
    send(res, 409, { code: 'CONFLICT', message: 'Already exists' });
    return;
  }

  req.log.error({ err, reqId: req.id }, 'unhandled error');
  send(res, 500, { code: 'INTERNAL', message: 'Something went wrong' });
};
