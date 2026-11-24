import { Types } from 'mongoose';
import request from 'supertest';
import type { TagDTO } from '@itsadate/shared';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { IdeaModel } from '../../models/idea.js';
import { TagModel } from '../../models/tag.js';
import { createTestUser } from '../../test/auth.js';
import { useTestDb } from '../../test/db.js';
import { testEnv } from '../../test/env.js';
import { createTestTag } from '../../test/factories.js';
import { errorOf } from '../../test/http.js';

useTestDb();

const app = createApp({ env: testEnv() });

describe('tags', () => {
  it('lists tags publicly, sorted by name', async () => {
    expect((await request(app).get('/api/v1/tags')).body).toEqual([]);
    await createTestTag({ name: 'Zoo', slug: 'zoo' });
    await createTestTag({ name: 'Art', slug: 'art' });
    const res = await request(app).get('/api/v1/tags');
    expect((res.body as TagDTO[]).map((t) => t.slug)).toEqual(['art', 'zoo']);
  });

  it('creates, rejects duplicates and invalid input', async () => {
    const { cookie: admin } = await createTestUser({ role: 'admin' });
    const created = await request(app)
      .post('/api/v1/admin/tags')
      .set('Cookie', admin)
      .send({ name: 'Board game', icon: 'dice-5' });
    expect(created.status).toBe(201);
    expect(created.body).toEqual({
      id: expect.any(String) as string,
      name: 'Board game',
      slug: 'board-game',
      icon: 'dice-5',
    });
    const dup = await request(app)
      .post('/api/v1/admin/tags')
      .set('Cookie', admin)
      .send({ name: 'board GAME', icon: 'x' });
    expect(dup.status).toBe(409);
    expect(errorOf(dup).message).toBe('A tag with this name already exists');
    const bad = await request(app)
      .post('/api/v1/admin/tags')
      .set('Cookie', admin)
      .send({ name: 'F' });
    expect(bad.status).toBe(422);
  });

  it('updates a tag, recomputing the slug, with 404, 409 and 422', async () => {
    const { cookie: admin } = await createTestUser({ role: 'admin' });
    const tag = await createTestTag({ name: 'Board game', slug: 'board-game' });
    await createTestTag({ name: 'Food', slug: 'food' });
    const url = `/api/v1/admin/tags/${tag.id as string}`;
    const renamed = await request(app).patch(url).set('Cookie', admin).send({ name: 'Games' });
    expect(renamed.status).toBe(200);
    expect((renamed.body as TagDTO).slug).toBe('games');
    const icon = await request(app).patch(url).set('Cookie', admin).send({ icon: 'dice' });
    expect(icon.body).toMatchObject({ name: 'Games', slug: 'games', icon: 'dice' });
    const same = await request(app).patch(url).set('Cookie', admin).send({ name: 'Games' });
    expect(same.status).toBe(200);
    expect((await request(app).patch(url).set('Cookie', admin).send({ name: 'food' })).status).toBe(
      409,
    );
    expect(
      (
        await request(app)
          .patch('/api/v1/admin/tags/not-an-id')
          .set('Cookie', admin)
          .send({ name: 'Games' })
      ).status,
    ).toBe(422);
    expect(
      (
        await request(app)
          .patch(`/api/v1/admin/tags/${new Types.ObjectId().toString()}`)
          .set('Cookie', admin)
          .send({ name: 'Zzz' })
      ).status,
    ).toBe(404);
  });

  it('deletes a tag and pulls it from ideas', async () => {
    const { cookie: admin, user } = await createTestUser({ role: 'admin' });
    const tag = await createTestTag();
    const other = await createTestTag();
    const idea = await IdeaModel.create({
      title: 'Picnic',
      description: 'Eat outside',
      creator: user._id,
      tags: [tag._id, other._id],
    });
    const del = await request(app)
      .delete(`/api/v1/admin/tags/${tag.id as string}`)
      .set('Cookie', admin);
    expect(del.status).toBe(204);
    expect((await IdeaModel.findById(idea._id))?.tags.map(String)).toEqual([String(other._id)]);
    const again = await request(app)
      .delete(`/api/v1/admin/tags/${tag.id as string}`)
      .set('Cookie', admin);
    expect(again.status).toBe(404);
    expect(
      (await request(app).delete('/api/v1/admin/tags/not-an-id').set('Cookie', admin)).status,
    ).toBe(422);
  });

  it('rejects names with no letters or digits with 422 on create and update', async () => {
    const { cookie: admin } = await createTestUser({ role: 'admin' });
    const bad = await request(app)
      .post('/api/v1/admin/tags')
      .set('Cookie', admin)
      .send({ name: '!!', icon: 'x' });
    expect(bad.status).toBe(422);
    expect(errorOf(bad).details).toEqual({
      issues: [{ location: 'body', path: 'name', message: 'Use at least one letter or number' }],
    });
    const tag = await createTestTag({ name: 'Food', slug: 'food' });
    const res = await request(app)
      .patch(`/api/v1/admin/tags/${tag.id as string}`)
      .set('Cookie', admin)
      .send({ name: '日本' });
    expect(res.status).toBe(422);
    const after = await TagModel.findById(tag._id);
    expect([after?.name, after?.slug]).toEqual(['Food', 'food']);
  });

  it('guards every admin tag route with 401 and 403', async () => {
    const { cookie: user } = await createTestUser();
    const id = new Types.ObjectId().toString();
    const routes = [
      ['post', '/api/v1/admin/tags', { name: 'Food', icon: 'x' }],
      ['patch', `/api/v1/admin/tags/${id}`, { name: 'Food' }],
      ['delete', `/api/v1/admin/tags/${id}`, undefined],
    ] as const;
    for (const [method, url, body] of routes) {
      expect((await request(app)[method](url).send(body)).status).toBe(401);
      expect((await request(app)[method](url).set('Cookie', user).send(body)).status).toBe(403);
    }
  });
});
