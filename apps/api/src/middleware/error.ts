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

  const e = (err ?? {}) as {
    type?: unknown;
    name?: string;
    code?: unknown;
    status?: unknown;
    statusCode?: unknown;
  };
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

  const status = typeof e.status === 'number' ? e.status : e.statusCode;
  if (typeof e.type === 'string' && typeof status === 'number' && status >= 400 && status <= 499) {
    send(res, status, { code: 'BAD_REQUEST', message: 'Bad request' });
    return;
  }

  if (req.log) {
    req.log.error({ err, reqId: req.id }, 'unhandled error');
  } else {
    console.error('unhandled error', err);
  }
  send(res, 500, { code: 'INTERNAL', message: 'Something went wrong' });
};
