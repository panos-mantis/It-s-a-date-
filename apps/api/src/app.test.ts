import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

describe('createApp', () => {
  it('answers the health check', async () => {
    const res = await request(createApp()).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const missing = await request(createApp()).get('/api/v1/nope');
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });
});
