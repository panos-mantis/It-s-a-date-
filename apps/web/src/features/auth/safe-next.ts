// Only same-origin paths may be used as a post-login destination (blocks open redirects).
export function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/')) return '/';
  if (next[1] === '/' || next[1] === '\\') return '/';
  // eslint-disable-next-line no-control-regex -- rejecting control characters is the point
  if (/[\u0000-\u001f\u007f]/.test(next)) return '/';
  return next;
}

// The line shown above Log in / Sign up that says why the user was sent there. A `reason` (from a
// heart or the rating, which can share a `next`) wins over the `next` path.
export function loginHint(next: string | null, reason: string | null): string | null {
  if (reason === 'save') return 'Log in to save ideas you like.';
  if (reason === 'rate') return 'Log in to rate this idea.';
  const path = next?.split(/[?#]/)[0];
  if (path === '/share') return 'Log in to share your idea';
  if (path === '/profile') return 'Log in to see your ideas and saved ideas';
  return null;
}

// A link between Log in and Sign up that keeps where the user was headed (and why), plus an email
// worth carrying over.
export function authPath(
  base: string,
  keep: { next?: string | null; reason?: string | null; email?: string | null },
): string {
  const query = new URLSearchParams();
  if (keep.email) query.set('email', keep.email);
  if (keep.next) query.set('next', keep.next);
  if (keep.reason) query.set('reason', keep.reason);
  const text = query.toString();
  return text ? `${base}?${text}` : base;
}
