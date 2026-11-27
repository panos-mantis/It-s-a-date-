import { toNestErrors } from '@hookform/resolvers';
import { zodResolver } from '@hookform/resolvers/zod';
import type {
  FieldError,
  FieldErrors,
  FieldValues,
  Path,
  Resolver,
  UseFormSetError,
} from 'react-hook-form';
import type { z } from 'zod';
import { ApiError, NETWORK_MESSAGE } from './api';

// Sets server-reported errors on the form: 422 issues land on their fields, anything else on
// `root.server` (shown in the form-level alert). Nested paths (`image.url`, `tagIds.0`) land on
// their top-level field; the first issue per field wins.
export function applyServerErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): void {
  if (err instanceof ApiError) {
    if (err.status === 422) {
      let matched = false;
      const seen = new Set<string>();
      for (const issue of err.issues) {
        if (issue.location !== 'body') continue;
        const top = issue.path.split('.')[0];
        const field = fields.find((f) => f === issue.path || f === top);
        if (!field || seen.has(field)) continue;
        seen.add(field);
        setError(field, { type: 'server', message: issue.message }, { shouldFocus: !matched });
        matched = true;
      }
      if (matched) return;
    }
    setError('root.server', { type: 'server', message: err.message });
    return;
  }
  setError('root.server', { type: 'server', message: NETWORK_MESSAGE });
}

// What the Zod 4 error callback receives. `input` is present because the resolver is created with
// `reportInput: true`.
interface MapIssue {
  code: string;
  path?: PropertyKey[];
  input?: unknown;
  minimum?: number | bigint;
  maximum?: number | bigint;
  origin?: string;
}

// Replaces Zod's default messages with the field copy. Returning undefined keeps the default.
export function authErrorMap(iss: MapIssue): string | undefined {
  const field = iss.path?.[iss.path.length - 1];
  const empty = iss.input === undefined || iss.input === '';

  if (field === 'email') {
    if (empty) return 'Enter your email.';
    return 'Enter an email like name@example.com.';
  }
  if (field === 'password') {
    if (empty) return 'Enter your password.';
    if (iss.code === 'too_small') return 'Use at least 8 characters.';
    if (iss.code === 'too_big' || iss.code === 'custom') return 'Use 72 characters or fewer.';
  }
  if (field === 'name') {
    if (iss.code === 'too_big') return 'Use 50 characters or fewer.';
    return 'Enter at least 2 characters.';
  }
  return undefined;
}

// Options for zodResolver(schema, authResolverOptions).
export const authResolverOptions = { error: authErrorMap, reportInput: true } as const;

export type FieldIssue = z.core.$ZodIssue;

/**
 * zodResolver, with each field's message chosen from that field's first top-level issue. A union
 * (the budget) is judged by its outer `invalid_union` issue rather than one of its branches, an
 * array element issue (`tagIds.0`) counts for its array, and a schema-level message (a refine)
 * can still get field copy. `messageFor` returns the copy, or undefined to keep Zod's message.
 */
export function fieldResolver<Input extends FieldValues, Output>(
  schema: z.ZodType<Output, Input>,
  messageFor: (issue: FieldIssue) => string | undefined,
): Resolver<Input, unknown, Output> {
  const base = zodResolver(schema, { reportInput: true });
  return async (values, context, options) => {
    const result = await base(values, context, options);
    if (Object.keys(result.errors).length === 0) return result;
    const parsed = schema.safeParse(values, { reportInput: true });
    if (parsed.success) return result;
    const flat: Record<string, FieldError> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.length > 0 ? String(issue.path[0]) : 'root.form';
      flat[key] ??= { type: issue.code, message: messageFor(issue) ?? issue.message };
    }
    return { values: {}, errors: toNestErrors(flat as FieldErrors<Input>, options) };
  };
}
