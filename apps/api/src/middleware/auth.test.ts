import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { SESSION_COOKIE } from '../features/auth/session.js';
import { UserModel } from '../models/user.js';
import { createTestUser } from '../test/auth.js';
import { useTestDb } from '../test/db.js';
import { testEnv } from '../test/env.js';
import { optionalAuth, requireAuth, requireRole } from './auth.js';

useTestDb();

const env = testEnv();
const app = createApp({
  env,
  extraRoutes: (r) => {
    r.get('/t/auth', requireAuth(env), (_q, res) => {
      res.json(res.locals.auth);
    });
    r.get('/t/optional', optionalAuth(env), (_q, res) => {
      res.json({ auth: res.locals.auth ?? null });
    });
    r.get('/t/admin', requireAuth(env), requireRole('admin'), (_q, res) => {
      res.json({ ok: true });
    });
  },
});

const cookieFor = (token: string) => `${SESSION_COOKIE}=${token}`;
const secret = env.JWT_SECRET;

describe('auth middleware', () => {
  it('requireAuth: 401 without a cookie, 200 with a valid one (role from DB)', async () => {
    expect((await request(app).get('/api/v1/t/auth')).status).toBe(401);
    const { user, cookie } = await createTestUser();
    const res = await request(app).get('/api/v1/t/auth').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: user.id as string, role: 'user' });
  });

  it('rejects a token signed with another secret', async () => {
    const { user } = await createTestUser();
    const bad = cookieFor(
      jwt.sign({ sub: user.id as string, role: 'user' }, 'x'.repeat(40), { algorithm: 'HS256' }),
    );
    expect((await request(app).get('/api/v1/t/auth').set('Cookie', bad)).status).toBe(401);
    const anon = await request(app).get('/api/v1/t/optional').set('Cookie', bad);
    expect(anon.status).toBe(200);
    expect(anon.body).toEqual({ auth: null });
  });
  it('treats a token with a non-ObjectId subject as unauthenticated', async () => {
    const bad = cookieFor(jwt.sign({ sub: 'nope', role: 'admin' }, secret, { algorithm: 'HS256' }));
    expect((await request(app).get('/api/v1/t/auth').set('Cookie', bad)).status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const { user } = await createTestUser();
    const old = cookieFor(
      jwt.sign({ sub: user.id as string, role: 'user' }, secret, {
        algorithm: 'HS256',
        expiresIn: -10,
      }),
    );
    expect((await request(app).get('/api/v1/t/auth').set('Cookie', old)).status).toBe(401);
    const anon = await request(app).get('/api/v1/t/optional').set('Cookie', old);
    expect(anon.body).toEqual({ auth: null });
  });

  it('rejects a valid token whose user was deleted', async () => {
    const { user, cookie } = await createTestUser();
    await UserModel.deleteOne({ _id: user._id });
    expect((await request(app).get('/api/v1/t/auth').set('Cookie', cookie)).status).toBe(401);
    const anon = await request(app).get('/api/v1/t/optional').set('Cookie', cookie);
    expect(anon.status).toBe(200);
    expect(anon.body).toEqual({ auth: null });
  });

  it('rejects an alg none token', async () => {
    const { user } = await createTestUser();
    const none = cookieFor(
      jwt.sign({ sub: user.id as string, role: 'admin' }, '', { algorithm: 'none' }),
    );
    expect((await request(app).get('/api/v1/t/auth').set('Cookie', none)).status).toBe(401);
  });

  it('optionalAuth attaches auth for a valid cookie', async () => {
    const { user, cookie } = await createTestUser();
    const res = await request(app).get('/api/v1/t/optional').set('Cookie', cookie);
    expect(res.body).toEqual({ auth: { userId: user.id as string, role: 'user' } });
  });

  it('requireRole: 401 anonymous, 403 user, 200 admin', async () => {
    expect((await request(app).get('/api/v1/t/admin')).status).toBe(401);
    const u = await createTestUser();
    expect((await request(app).get('/api/v1/t/admin').set('Cookie', u.cookie)).status).toBe(403);
    const a = await createTestUser({ role: 'admin' });
    expect((await request(app).get('/api/v1/t/admin').set('Cookie', a.cookie)).status).toBe(200);
  });

  it('takes the role from the DB, not the token', async () => {
    const { user } = await createTestUser();
    const forged = cookieFor(
      jwt.sign({ sub: user.id as string, role: 'admin' }, secret, { algorithm: 'HS256' }),
    );
    expect((await request(app).get('/api/v1/t/admin').set('Cookie', forged)).status).toBe(403);
  });
});
