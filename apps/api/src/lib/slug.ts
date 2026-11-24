/** Lowercase ASCII slug: diacritics stripped, runs of non [a-z0-9] become one dash. */
export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
