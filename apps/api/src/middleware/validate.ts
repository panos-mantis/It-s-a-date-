import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import type { ValidationIssue } from '@itsadate/shared';
import { validationError } from '../lib/errors.js';

type Part = 'body' | 'query' | 'params';
const PARTS: Part[] = ['params', 'query', 'body'];

/**
 * Parses the request with shared Zod schemas. Output goes to res.locals.validated
 * (Express 5 makes req.query read-only), never back onto req.
 */
export function validate(schemas: {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}): RequestHandler {
  return (req, res, next) => {
    const validated: Record<string, unknown> = {};
    const issues: ValidationIssue[] = [];

    for (const part of PARTS) {
      const schema = schemas[part];
      if (!schema) continue;
      const input: unknown = part === 'body' ? (req.body ?? {}) : req[part];
      const result = schema.safeParse(input);
      if (result.success) {
        validated[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          issues.push({
            location: part,
            path: issue.path.map(String).join('.'),
            message: issue.message,
          });
        }
      }
    }

    if (issues.length > 0) {
      next(validationError({ issues }));
      return;
    }
    res.locals.validated = validated;
    next();
  };
}
