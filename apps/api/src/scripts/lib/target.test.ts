import { describe, expect, it, vi } from 'vitest';
import { confirmTarget, loadScriptEnv, resolveTarget } from './target.js';

describe('resolveTarget', () => {
  it('takes the db name from the URI', () => {
    expect(resolveTarget({ uri: 'mongodb://h/itsadate_dev' })).toEqual({
      dbName: 'itsadate_dev',
      isProd: false,
    });
  });

  it('lets --db override the URI', () => {
    expect(resolveTarget({ uri: 'mongodb://h/other', dbFlag: 'itsadate_dev' }).dbName).toBe(
      'itsadate_dev',
    );
  });

  it('refuses prod unless --db ItsADate is explicit', () => {
    expect(() => resolveTarget({ uri: 'mongodb://h/ItsADate' })).toThrow(/--db ItsADate/);
    expect(resolveTarget({ uri: 'mongodb://h/itsadate_dev', dbFlag: 'ItsADate' })).toEqual({
      dbName: 'ItsADate',
      isProd: true,
    });
  });

  it('matches prod case-insensitively', () => {
    expect(() => resolveTarget({ uri: 'mongodb://h/itsadate' })).toThrow(/--db ItsADate/);
    expect(resolveTarget({ uri: 'mongodb://h/x', dbFlag: 'itsadate' }).isProd).toBe(true);
  });

  it('throws when no db name can be found', () => {
    expect(() => resolveTarget({ uri: 'mongodb://h' })).toThrow();
    expect(() => resolveTarget({ uri: 'mongodb://h/', dbFlag: '  ' })).toThrow();
  });
});

describe('confirmTarget', () => {
  it('requires the exact db name for prod', async () => {
    const prod = { dbName: 'ItsADate', isProd: true };
    await expect(confirmTarget(prod, () => Promise.resolve('itsadate'))).rejects.toThrow();
    await expect(confirmTarget(prod, () => Promise.resolve('ItsADate'))).resolves.toBeUndefined();
  });

  it('does not ask for non-prod targets', async () => {
    const ask = vi.fn(() => Promise.resolve(''));
    await confirmTarget({ dbName: 'itsadate_dev', isProd: false }, ask);
    expect(ask).not.toHaveBeenCalled();
  });
});

describe('loadScriptEnv', () => {
  it('reads MONGODB_URI and DNS_SERVERS only', () => {
    expect(
      loadScriptEnv({ MONGODB_URI: 'mongodb://h/d', DNS_SERVERS: '1.1.1.1, 8.8.8.8' }, false),
    ).toEqual({ uri: 'mongodb://h/d', dnsServers: ['1.1.1.1', '8.8.8.8'] });
    expect(loadScriptEnv({ MONGODB_URI: 'mongodb://h/d' }, false)).toEqual({
      uri: 'mongodb://h/d',
      dnsServers: undefined,
    });
  });

  it('fails clearly without echoing values when MONGODB_URI is missing', () => {
    expect(() => loadScriptEnv({}, false)).toThrow(/MONGODB_URI/);
  });
});
