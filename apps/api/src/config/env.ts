import { existsSync } from 'node:fs';
import { z } from 'zod';

const PLACEHOLDER_SECRET = 'replace-with-a-long-random-string';
const PROD_DB = 'ItsADate';

/** Database name from a Mongo connection string, or '' if there is none. */
export function mongoDbName(uri: string): string {
  const afterScheme = uri.replace(/^mongodb(?:\+srv)?:\/\//, '');
  const slash = afterScheme.indexOf('/');
  if (slash === -1) return '';
  return afterScheme.slice(slash + 1).split('?')[0] ?? '';
}

const csv = z.string().transform((s) =>
  s
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean),
);

const emptyToUndef = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    MONGODB_URI: z.string().min(1),
    JWT_SECRET: z
      .string()
      .min(32)
      .refine((s) => s !== PLACEHOLDER_SECRET),
    CORS_ORIGINS: z.preprocess(
      emptyToUndef,
      csv.pipe(z.array(z.string()).min(1)).default(['http://localhost:5173']),
    ),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    DNS_SERVERS: z.preprocess(emptyToUndef, csv.optional()),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(20),
    CLOUDINARY_CLOUD_NAME: z.preprocess(emptyToUndef, z.string().optional()),
  })
  .superRefine((env, ctx) => {
    const db = mongoDbName(env.MONGODB_URI);
    if (!db) {
      ctx.addIssue({
        code: 'custom',
        path: ['MONGODB_URI'],
        message: 'must name a database',
      });
    } else if (db === PROD_DB && env.NODE_ENV !== 'production') {
      ctx.addIssue({
        code: 'custom',
        path: ['MONGODB_URI'],
        message: `database ${PROD_DB} is only allowed when NODE_ENV=production`,
      });
    }
  })
  .transform((env) => ({
    ...env,
    CLOUDINARY_FOLDER: env.NODE_ENV === 'production' ? 'itsadate/prod' : 'itsadate/dev',
  }));

export type Env = z.output<typeof envSchema>;

/** Validates the environment. The error names invalid keys, never their values. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (result.success) return result.data;
  const lines = result.error.issues.map((issue) => {
    const key = issue.path.join('.') || '(env)';
    return issue.code === 'custom' ? `${key}: ${issue.message}` : `${key}: invalid value`;
  });
  throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
}

/** Loads a dotenv file into process.env if it exists. */
export function loadDotEnvFile(path = '.env'): void {
  if (existsSync(path)) process.loadEnvFile(path);
}
