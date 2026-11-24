export interface SeedUser {
  name: string;
  email: string;
}

/** Dev-only authors and raters. They get random, never-printed passwords, so nobody can log in. */
export const SAMPLE_USERS: SeedUser[] = [
  { name: 'Maya Okafor', email: 'maya@example.com' },
  { name: 'Leo Brandt', email: 'leo@example.com' },
  { name: 'Priya Nair', email: 'priya@example.com' },
  { name: 'Tomás Rivera', email: 'tomas@example.com' },
  { name: 'Hannah Kim', email: 'hannah@example.com' },
];

/**
 * The author of the curated ideas in prod. `.invalid` can never receive mail; registration
 * rejects reserved domains and the seed refuses to adopt a same-email account it did not create.
 */
export const TEAM_USER: SeedUser = { name: "It's a Date team", email: 'team@itsadate.invalid' };
