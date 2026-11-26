import type {
  ApiErrorBody,
  ApiErrorCode,
  ValidationErrorDetails,
  ValidationIssue,
} from '@itsadate/shared';

export const API_BASE = '/api/v1';
export const NETWORK_MESSAGE = "We can't reach the server. Check your connection and try again.";

function isValidationDetails(value: unknown): value is ValidationErrorDetails {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { issues?: unknown }).issues)
  );
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | 'NETWORK';
  readonly details?: unknown;

  constructor(status: number, code: ApiErrorCode | 'NETWORK', message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get issues(): ValidationIssue[] {
    return isValidationDetails(this.details) ? this.details.issues : [];
  }
}

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions {
  method: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  form?: FormData;
  signal?: AbortSignal;
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null) return false;
  const error = (value as { error?: unknown }).error;
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { code?: unknown }).code === 'string' &&
    typeof (error as { message?: unknown }).message === 'string'
  );
}

/** Turns a failed response (status plus parsed JSON, if any) into an ApiError. */
export function toApiError(status: number, json: unknown): ApiError {
  if (isErrorBody(json)) {
    const { code, message, details } = json.error;
    return new ApiError(status, code, message, details);
  }
  // A non-JSON error body is almost always the proxy failing to reach the API.
  return new ApiError(status, 'INTERNAL', NETWORK_MESSAGE);
}

async function request<T>(path: string, opts: RequestOptions): Promise<T> {
  const url = new URL(API_BASE + path, window.location.origin);
  for (const [key, value] of Object.entries(opts.query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }

  const hasBody = opts.body !== undefined;
  const headers: Record<string, string> = { Accept: 'application/json' };
  // A FormData body gets no Content-Type: the browser adds multipart with its boundary.
  if (hasBody) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method,
      credentials: 'include',
      headers,
      body: opts.form ?? (hasBody ? JSON.stringify(opts.body) : undefined),
      signal: opts.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK', NETWORK_MESSAGE);
  }

  if (res.status === 204) return undefined as T;

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    json = undefined;
  }

  if (!res.ok) throw toApiError(res.status, json);
  return json as T;
}

export const api = {
  get<T>(
    path: string,
    opts: { query?: Record<string, QueryValue>; signal?: AbortSignal } = {},
  ): Promise<T> {
    return request<T>(path, { method: 'GET', ...opts });
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: 'POST', body });
  },
  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: 'PUT', body });
  },
  /** POSTs multipart form data; sends no Content-Type so the browser sets the boundary. */
  upload<T>(path: string, form: FormData): Promise<T> {
    return request<T>(path, { method: 'POST', form });
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: 'PATCH', body });
  },
  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' });
  },
};
