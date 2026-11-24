import bcrypt from 'bcryptjs';
import type { UserDTO } from '@itsadate/shared';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { UserModel } from '../../models/user.js';
import { errorOf } from '../../test/http.js';
import { testEnv } from '../../test/env.js';
import { useTestDb } from '../../test/db.js';

useTestDb();

const app = createApp({ env: testEnv() });
const creds = { name: ' Ana ', email: 'Ana@X.com', password: 'correct-horse' };

describe('auth', () => {
  it('registers a user', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send(creds);
    expect(reg.status).toBe(201);
    expect(reg.body).toEqual({
      id: expect.any(String) as string,
      name: 'Ana',
      email: 'ana@x.com',
      role: 'user',
    });
    expect(JSON.stringify(reg.body)).not.toMatch(/password/i);
    const setCookie = (reg.headers['set-cookie'] as unknown as string[])[0] ?? '';
    expect(setCookie).toMatch(/^itsadate_session=/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).not.toMatch(/Secure/);
    const stored = await UserModel.findOne({ email: 'ana@x.com' }).select('+passwordHash');
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });

  it('rejects a duplicate email with 409 and invalid input with 422', async () => {
    await request(app).post('/api/v1/auth/register').send(creds);
    const dup = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana', email: 'ana@x.com', password: 'correct-horse' });
    expect(dup.status).toBe(409);
    expect(errorOf(dup).message).toBe('An account with this email already exists');
    const bad = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'A', email: 'bad', password: 'x' });
    expect(bad.status).toBe(422);
  });

  it('logs in, with identical 401s for wrong password and unknown email', async () => {
    await request(app).post('/api/v1/auth/register').send(creds);
    const ok = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ' ANA@x.com ', password: 'correct-horse' });
    expect(ok.status).toBe(200);
    expect((ok.body as UserDTO).email).toBe('ana@x.com');
    expect(ok.headers['set-cookie']).toBeDefined();
    const wrong = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ana@x.com', password: 'nope' });
    const unknown = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'who@x.com', password: 'nope' });
    expect([wrong.status, unknown.status]).toEqual([401, 401]);
    expect(wrong.body).toEqual(unknown.body);
    expect(errorOf(wrong).message).toBe('Email or password is wrong');
  });

  it('rejects operator injection in login with 422', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: { $ne: null }, password: 'x' });
    expect(res.status).toBe(422);
  });

  it('still logs in a legacy cost-10 hash', async () => {
    await UserModel.create({
      name: 'Old',
      email: 'old@x.com',
      passwordHash: bcrypt.hashSync('legacy-pass', 10),
    });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'old@x.com', password: 'legacy-pass' });
    expect(res.status).toBe(200);
  });

  it('serves me and logout', async () => {
    await request(app).post('/api/v1/auth/register').send(creds);
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/login').send({ email: 'ana@x.com', password: 'correct-horse' });
    expect(((await agent.get('/api/v1/auth/me')).body as UserDTO).email).toBe('ana@x.com');
    expect((await agent.post('/api/v1/auth/logout')).status).toBe(204);
    expect((await agent.get('/api/v1/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/v1/auth/me')).body).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Please log in' },
    });
  });

  it('logout works without a cookie', async () => {
    expect((await request(app).post('/api/v1/auth/logout')).status).toBe(204);
  });

  it('rate-limits register and login per app instance', async () => {
    const limited = createApp({ env: testEnv({ AUTH_RATE_LIMIT_MAX: 2 }) });
    for (let i = 0; i < 2; i++) {
      await request(limited).post('/api/v1/auth/login').send({ email: 'a@b', password: 'x' });
    }
    const third = await request(limited)
      .post('/api/v1/auth/login')
      .send({ email: 'a@b', password: 'x' });
    expect(third.status).toBe(429);
    expect(errorOf(third).code).toBe('RATE_LIMITED');
    expect(errorOf(third).message).toBe('Too many attempts. Try again in a few minutes.');
    // a fresh app has a fresh limiter
    const fresh = await request(createApp({ env: testEnv({ AUTH_RATE_LIMIT_MAX: 2 }) }))
      .post('/api/v1/auth/login')
      .send({ email: 'a@b', password: 'x' });
    expect(fresh.status).toBe(401);
  });
});
