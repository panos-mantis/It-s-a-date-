const absolute = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

/** "Mar 9, 2024". All ideas' Created column always uses this. */
export function formatDate(iso: string): string {
  return absolute.format(new Date(iso));
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * The admin "Submitted" date (HANDOFF §3 Copy): "today" on the same calendar day, "N days ago" up
 * to 6 days, then the absolute date ("Mar 9, 2024").
 */
export function relativeSubmitted(iso: string, now: Date): string {
  const then = new Date(iso);
  // Rounded, so a daylight-saving change in between still counts as whole days.
  const days = Math.round((startOfDay(now) - startOfDay(then)) / DAY_MS);
  if (days <= 0) return 'today';
  if (days <= 6) return days === 1 ? '1 day ago' : `${days} days ago`;
  return formatDate(iso);
}
