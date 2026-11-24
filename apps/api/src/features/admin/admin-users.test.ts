import { Types } from 'mongoose';
import request from 'supertest';
import type { Paginated, UserDTO } from '@itsadate/shared';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { UserModel } from '../../models/user.js';
import { createTestUser } from '../../test/auth.js';
import { useTestDb } from '../../test/db.js';
import { testEnv } from '../../test/env.js';
import { errorOf } from '../../test/http.js';

useTestDb();

const app = createApp({ env: testEnv() });
const base = '/api/v1/admin/users';

describe('admin users', () => {
  it('lists users newest first, filters by escaped q, never leaks hashes', async () => {
    const { cookie: admin } = await createTestUser({ role: 'admin', email: 'boss@x.com' });
    await createTestUser({ name: 'Ana', email: 'ana@x.com' });
    await createTestUser({ name: 'Bob', email: 'bob@x.com' });
    const list = await request(app).get(`${base}?q=ANA`).set('Cookie', admin);
    expect(list.status).toBe(200);
    expect((list.body as Paginated<UserDTO>).items.map((u) => u.email)).toEqual(['ana@x.com']);
    expect(JSON.stringify(list.body)).not.toMatch(/passwordHash/);
    const regex = await request(app).get(base).query({ q: '.*' }).set('Cookie', admin);
    expect((regex.body as Paginated<UserDTO>).total).toBe(0);
    const all = await request(app).get(base).set('Cookie', admin);
    expect((all.body as Paginated<UserDTO>).items.map((u) => u.email)).toEqual([
      'bob@x.com',
      'ana@x.com',
      'boss@x.com',
    ]);
  });

  it('promotes a user; 404 and 422', async () => {
    const { cookie: admin } = await createTestUser({ role: 'admin' });
    const { user: ana } = await createTestUser();
    const url = `${base}/${ana.id as string}/role`;
    const promoted = await request(app).post(url).set('Cookie', admin).send({ role: 'admin' });
    expect(promoted.status).toBe(200);
    expect((promoted.body as UserDTO).role).toBe('admin');
    expect(JSON.stringify(promoted.body)).not.toMatch(/passwordHash/);
    expect((await request(app).post(url).set('Cookie', admin).send({ role: 'owner' })).status).toBe(
      422,
    );
    expect(
      (await request(app).post(`${base}/bad-id/role`).set('Cookie', admin).send({ role: 'user' }))
        .status,
    ).toBe(422);
    expect(
      (
        await request(app)
          .post(`${base}/${new Types.ObjectId().toString()}/role`)
          .set('Cookie', admin)
          .send({ role: 'user' })
      ).status,
    ).toBe(404);
  });

  it("a demoted admin's existing cookie loses admin access", async () => {
    const { cookie: admin } = await createTestUser({ role: 'admin' });
    const { user: ana, cookie: anaCookie } = await createTestUser({ role: 'admin' });
    const demote = await request(app)
      .post(`${base}/${ana.id as string}/role`)
      .set('Cookie', admin)
      .send({ role: 'user' });
    expect(demote.status).toBe(200);
    expect((await request(app).get('/api/v1/admin/ideas').set('Cookie', anaCookie)).status).toBe(
      403,
    );
    await UserModel.deleteOne({ _id: ana._id });
    expect((await request(app).get('/api/v1/admin/ideas').set('Cookie', anaCookie)).status).toBe(
      401,
    );
  });

  it('refuses to demote the last admin, including an admin demoting themself', async () => {
    const { user, cookie: admin } = await createTestUser({ role: 'admin' });
    const url = `${base}/${user.id as string}/role`;
    const res = await request(app).post(url).set('Cookie', admin).send({ role: 'user' });
    expect(res.status).toBe(409);
    expect(errorOf(res).message).toBe("You can't remove the last admin");
    expect(await UserModel.countDocuments({ role: 'admin' })).toBe(1);
    // with a second admin, self-demotion is allowed
    await createTestUser({ role: 'admin' });
    const ok = await request(app).post(url).set('Cookie', admin).send({ role: 'user' });
    expect(ok.status).toBe(200);
  });

  it('never ends with zero admins when two admins demote each other at once', async () => {
    const a = await createTestUser({ role: 'admin' });
    const b = await createTestUser({ role: 'admin' });
    const demote = (target: typeof a, by: typeof a) =>
      request(app)
        .post(`${base}/${target.user.id as string}/role`)
        .set('Cookie', by.cookie)
        .send({ role: 'user' });
    const results = await Promise.all([demote(a, b), demote(b, a)]);
    // Depending on timing a request may succeed, be refused (409) or lose its admin
    // session first (403); only the invariant matters.
    for (const r of results) expect([200, 403, 409]).toContain(r.status);
    expect(await UserModel.countDocuments({ role: 'admin' })).toBeGreaterThanOrEqual(1);
  });

  it('requires an admin session on every route (401 and 403)', async () => {
    const { cookie: userCookie } = await createTestUser();
    const id = new Types.ObjectId().toString();
    const routes = [
      () => request(app).get(base),
      () => request(app).post(`${base}/${id}/role`).send({ role: 'admin' }),
    ];
    for (const call of routes) {
      expect((await call()).status).toBe(401);
      expect((await call().set('Cookie', userCookie)).status).toBe(403);
    }
  });
});
