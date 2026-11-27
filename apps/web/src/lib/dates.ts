/**
 * "Mar 9, 2024", in the reader's own time zone so every page agrees on which day an idea was
 * shared. The formatter is built per call so it follows the zone in force at that moment.
 */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}
