import { Types } from 'mongoose';
import request from 'supertest';
import type { IdeaDTO, Paginated } from '@itsadate/shared';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { RatingModel } from '../../models/rating.js';
import { SaveModel } from '../../models/save.js';
import { createTestUser } from '../../test/auth.js';
import { useTestDb } from '../../test/db.js';
import { testEnv } from '../../test/env.js';
import { createTestIdea, createTestTag } from '../../test/factories.js';

useTestDb();

const app = createApp({ env: testEnv() });
const base = '/api/v1/admin/ideas';

async function setup() {
  const { cookie: admin } = await createTestUser({ role: 'admin' });
  const { user, cookie: userCookie } = await createTestUser();
  const tag = await createTestTag();
  const mk = (overrides: Record<string, unknown>) =>
    createTestIdea({ creator: user._id, tags: [tag._id], ...overrides });
  return { admin, user, userCookie, tag, mk };
}

describe('admin ideas', () => {
  it('lists the pending queue oldest first, other statuses newest first', async () => {
    const { admin, mk } = await setup();
    const newerPending = await mk({ status: 'pending', createdAt: new Date('2026-02-01') });
    const olderPending = await mk({ status: 'pending', createdAt: new Date('2026-01-01') });
    const r1 = await mk({ status: 'rejected', createdAt: new Date('2026-01-01') });
    const r2 = await mk({ status: 'rejected', createdAt: new Date('2026-03-01') });
    await mk({ status: 'approved' });

    const queue = await request(app).get(base).set('Cookie', admin);
    expect(queue.status).toBe(200);
    expect((queue.body as Paginated<IdeaDTO>).items.map((i) => i.id)).toEqual([
      olderPending.id,
      newerPending.id,
    ]);
    const rejected = await request(app).get(`${base}?status=rejected`).set('Cookie', admin);
    expect((rejected.body as Paginated<IdeaDTO>).total).toBe(2);
    expect((rejected.body as Paginated<IdeaDTO>).items.map((i) => i.id)).toEqual([r2.id, r1.id]);
    expect((await request(app).get(`${base}?status=nope`).set('Cookie', admin)).status).toBe(422);
  });

  it('approves an idea with fields, making it public; 422 and 404', async () => {
    const { admin, mk } = await setup();
    const idea = await mk({ status: 'pending' });
    const url = `${base}/${idea.id as string}`;
    expect((await request(app).get(`/api/v1/ideas/${idea.id as string}`)).status).toBe(404);
    const approved = await request(app)
      .patch(url)
      .set('Cookie', admin)
      .send({ status: 'approved', budget: '3', duration: 'full-day', placeType: 'museum' });
    expect(approved.status).toBe(200);
    expect(approved.body).toMatchObject({
      status: 'approved',
      budget: 3,
      duration: 'full-day',
      placeType: 'museum',
    });
    expect((await request(app).get(`/api/v1/ideas/${idea.id as string}`)).status).toBe(200);

    const unknownTag = await request(app)
      .patch(url)
      .set('Cookie', admin)
      .send({ tagIds: [new Types.ObjectId().toString()] });
    expect(unknownTag.status).toBe(422);
    const badImage = await request(app)
      .patch(url)
      .set('Cookie', admin)
      .send({ image: { url: 'https://evil.example/x.jpg', publicId: 'x' } });
    expect(badImage.status).toBe(422);
    expect(
      (await request(app).patch(url).set('Cookie', admin).send({ status: 'nope' })).status,
    ).toBe(422);
    expect(
      (await request(app).patch(`${base}/bad-id`).set('Cookie', admin).send({ status: 'approved' }))
        .status,
    ).toBe(422);
    expect(
      (
        await request(app)
          .patch(`${base}/${new Types.ObjectId().toString()}`)
          .set('Cookie', admin)
          .send({ status: 'approved' })
      ).status,
    ).toBe(404);
  });

  it('deletes an idea with its ratings and saves; 404 and 422', async () => {
    const { admin, user, mk } = await setup();
    const idea = await mk({ status: 'pending' });
    await RatingModel.create({ idea: idea._id, user: user._id, value: 5 });
    await SaveModel.create({ idea: idea._id, user: user._id });
    const url = `${base}/${idea.id as string}`;
    expect((await request(app).delete(url).set('Cookie', admin)).status).toBe(204);
    expect(await RatingModel.countDocuments({ idea: idea._id })).toBe(0);
    expect(await SaveModel.countDocuments({ idea: idea._id })).toBe(0);
    expect((await request(app).delete(url).set('Cookie', admin)).status).toBe(404);
    expect((await request(app).delete(`${base}/bad-id`).set('Cookie', admin)).status).toBe(422);
  });

  it('requires an admin session on every route (401 and 403)', async () => {
    const { userCookie } = await setup();
    const id = new Types.ObjectId().toString();
    const routes = [
      () => request(app).get(base),
      () => request(app).patch(`${base}/${id}`).send({ status: 'approved' }),
      () => request(app).delete(`${base}/${id}`),
    ];
    for (const call of routes) {
      expect((await call()).status).toBe(401);
      expect((await call().set('Cookie', userCookie)).status).toBe(403);
    }
  });
});
