import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError, NETWORK_MESSAGE } from './api';

// Sets server-reported errors on the form: 422 issues land on their fields, anything else on
// `root.server` (shown in the form-level alert).
export function applyServerErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): void {
  if (err instanceof ApiError) {
    if (err.status === 422) {
      let matched = false;
      for (const issue of err.issues) {
        if (issue.location !== 'body') continue;
        const field = fields.find((f) => f === issue.path);
        if (!field) continue;
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
