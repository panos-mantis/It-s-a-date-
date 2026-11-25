// Only same-origin paths may be used as a post-login destination (blocks open redirects).
export function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/')) return '/';
  if (next[1] === '/' || next[1] === '\\') return '/';
  // eslint-disable-next-line no-control-regex -- rejecting control characters is the point
  if (/[\u0000-\u001f\u007f]/.test(next)) return '/';
  return next;
}
