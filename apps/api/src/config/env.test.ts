import { describe, expect, it } from 'vitest';
import { loadEnv, mongoDbName } from './env.js';

const base = { MONGODB_URI: 'mongodb://h/itsadate_dev', JWT_SECRET: 'x'.repeat(40) };

describe('loadEnv', () => {
  it('applies defaults', () => {
    expect(loadEnv(base)).toMatchObject({
      NODE_ENV: 'development',
      PORT: 4000,
      CORS_ORIGINS: ['http://localhost:5173'],
      CLOUDINARY_FOLDER: 'itsadate/dev',
      TRUST_PROXY: 0,
      LOG_LEVEL: 'info',
      AUTH_RATE_LIMIT_MAX: 20,
    });
  });

  it('splits comma lists', () => {
    expect(loadEnv({ ...base, CORS_ORIGINS: 'https://a.com, https://b.com' }).CORS_ORIGINS).toEqual(
      ['https://a.com', 'https://b.com'],
    );
    expect(loadEnv({ ...base, DNS_SERVERS: '8.8.8.8,1.1.1.1' }).DNS_SERVERS).toEqual([
      '8.8.8.8',
      '1.1.1.1',
    ]);
    expect(loadEnv(base).DNS_SERVERS).toBeUndefined();
  });

  it('rejects weak or placeholder secrets', () => {
    expect(() => loadEnv({ ...base, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
    expect(() => loadEnv({ ...base, JWT_SECRET: 'replace-with-a-long-random-string' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('requires a database name and guards the production database', () => {
    expect(() => loadEnv({ ...base, MONGODB_URI: 'mongodb://h/' })).toThrow(/MONGODB_URI/);
    expect(() => loadEnv({ ...base, MONGODB_URI: 'mongodb+srv://u:p@h/ItsADate?x=1' })).toThrow(
      /ItsADate/,
    );
    expect(
      loadEnv({ ...base, NODE_ENV: 'production', MONGODB_URI: 'mongodb+srv://u:p@h/ItsADate' })
        .CLOUDINARY_FOLDER,
    ).toBe('itsadate/prod');
  });

  it('never echoes secret values in the error', () => {
    let message = '';
    try {
      loadEnv({ ...base, JWT_SECRET: 'hunter2-secret', MONGODB_URI: 'mongodb://u:pw0rd@h/' });
    } catch (e) {
      message = String(e);
    }
    expect(message).toContain('JWT_SECRET');
    expect(message).not.toContain('hunter2-secret');
    expect(message).not.toContain('pw0rd');
  });
});

describe('mongoDbName', () => {
  it('extracts the database name', () => {
    expect(mongoDbName('mongodb+srv://u:p@h/itsadate_dev?retryWrites=true')).toBe('itsadate_dev');
    expect(mongoDbName('mongodb://h:27017/')).toBe('');
    expect(mongoDbName('mongodb://h:27017')).toBe('');
  });
});
