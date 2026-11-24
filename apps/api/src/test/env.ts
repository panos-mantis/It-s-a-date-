import type { Env } from '../config/env.js';

export function testEnv(overrides: Partial<Env> = {}): Env {
  return {
    NODE_ENV: 'test',
    PORT: 4000,
    MONGODB_URI: 'mongodb://localhost:27017/itsadate_test',
    JWT_SECRET: 't'.repeat(40),
    CORS_ORIGINS: ['http://localhost:5173'],
    TRUST_PROXY: 0,
    LOG_LEVEL: 'info',
    DNS_SERVERS: undefined,
    AUTH_RATE_LIMIT_MAX: 20,
    CLOUDINARY_CLOUD_NAME: undefined,
    CLOUDINARY_FOLDER: 'itsadate/dev',
    ...overrides,
  };
}
