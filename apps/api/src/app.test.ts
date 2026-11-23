import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { testEnv } from './test/env.js';
import { errorOf } from './test/http.js';

const app = () => createApp({ env: testEnv() });

describe('createApp', () => {
  it('answers the health check', async () => {
    const res = await request(app()).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const missing = await request(app()).get('/api/v1/nope');
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  it('answers malformed JSON with 400', async () => {
    const res = await request(app())
      .post('/api/v1/anything')
      .set('Content-Type', 'application/json')
      .send('{"a":');
    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toEqual({ error: { code: 'BAD_REQUEST', message: 'Malformed JSON' } });
  });

  it('answers an oversized body with 413', async () => {
    const res = await request(app())
      .post('/api/v1/anything')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ a: 'x'.repeat(200_000) }));
    expect(res.status).toBe(413);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(errorOf(res).code).toBe('BAD_REQUEST');
  });

  it('hides unexpected errors behind a 500', async () => {
    const a = createApp({
      env: testEnv(),
      extraRoutes: (router) => {
        router.get('/boom', () => {
          throw new Error('boom');
        });
      },
    });
    const res = await request(a).get('/api/v1/boom');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
    expect(JSON.stringify(res.body)).not.toContain('boom');
  });

  it('maps duplicate-key and cast errors', async () => {
    const a = createApp({
      env: testEnv(),
      extraRoutes: (router) => {
        router.get('/dup', () => {
          throw Object.assign(new Error('E11000 dup'), { code: 11000 });
        });
        router.get('/cast', () => {
          throw Object.assign(new Error('Cast failed'), { name: 'CastError' });
        });
      },
    });
    const dup = await request(a).get('/api/v1/dup');
    expect(dup.status).toBe(409);
    expect(dup.body).toEqual({ error: { code: 'CONFLICT', message: 'Already exists' } });
    const cast = await request(a).get('/api/v1/cast');
    expect(cast.status).toBe(400);
    expect(errorOf(cast).code).toBe('BAD_REQUEST');
  });

  it('sets and echoes x-request-id', async () => {
    const generated = await request(app()).get('/healthz');
    expect(generated.headers['x-request-id']).toBeTruthy();
    const echoed = await request(app()).get('/healthz').set('x-request-id', 'abc-123');
    expect(echoed.headers['x-request-id']).toBe('abc-123');
    const invalid = await request(app()).get('/healthz').set('x-request-id', 'bad id!');
    expect(invalid.headers['x-request-id']).not.toBe('bad id!');
  });

  it('allows only listed CORS origins', async () => {
    const ok = await request(app()).get('/healthz').set('Origin', 'http://localhost:5173');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(ok.headers['access-control-allow-credentials']).toBe('true');
    const evil = await request(app()).get('/healthz').set('Origin', 'https://evil.example');
    expect(evil.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('sets security headers', async () => {
    const res = await request(app()).get('/healthz');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
