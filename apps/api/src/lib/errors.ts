import type { ApiErrorCode, ValidationErrorDetails } from '@itsadate/shared';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (msg: string) => new AppError(400, 'BAD_REQUEST', msg);
export const unauthorized = (msg = 'Please log in') => new AppError(401, 'UNAUTHORIZED', msg);
export const forbidden = (msg = "You don't have access to this") =>
  new AppError(403, 'FORBIDDEN', msg);
export const notFound = (msg = 'Not found') => new AppError(404, 'NOT_FOUND', msg);
export const conflict = (msg: string) => new AppError(409, 'CONFLICT', msg);
export const validationError = (
  details: ValidationErrorDetails,
  msg = 'Check the highlighted fields',
) => new AppError(422, 'VALIDATION', msg, details);
