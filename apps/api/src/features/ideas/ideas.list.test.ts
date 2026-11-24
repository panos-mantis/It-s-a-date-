import jwt from 'jsonwebtoken';
import request from 'supertest';
import type { IdeaDTO, Paginated } from '@itsadate/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { IdeaModel } from '../../models/idea.js';
import { RatingModel } from '../../models/rating.js';
import { SaveModel } from '../../models/save.js';
import type { UserDoc } from '../../models/user.js';
import { createTestUser } from '../../test/auth.js';
import { useTestDb } from '../../test/db.js';
import { testEnv } from '../../test/env.js';
import { createTestIdea, createTestTag } from '../../test/factories.js';

useTestDb();

const app = createApp({ env: testEnv() });
const list = async (qs = '') =>
  (await request(app).get(`/api/v1/ideas${qs}`)).body as Paginated<IdeaDTO>;
const titles = (p: Paginated<IdeaDTO>) => p.items.map((i) => i.title);

let user: UserDoc;
let cookie: string;
let ideaA: string;

beforeEach(async () => {
  ({ user, cookie } = await createTestUser());
  const food = await createTestTag({ name: 'food', slug: 'food' });
  const adventure = await createTestTag({ name: 'adventure', slug: 'adventure' });
  const base = Date.now() - 100_000;
  const a = await createTestIdea({
    creator: user._id,
    title: 'Sushi night',
    tags: [food._id],
    budget: 2,
    duration: 'half-day',
    createdAt: new Date(base),
  });
  await createTestIdea({
    creator: user._id,
    title: 'Hike a hill',
    description: 'Climb to the top and enjoy the view together.',
    tags: [adventure._id],
    createdAt: new Date(base + 1000),
  });
  await createTestIdea({
    creator: user._id,
    title: 'Cook pasta',
    tags: [food._id],
    createdAt: new Date(base + 2000),
  });
  await createTestIdea({ creator: user._id, title: 'Pending one', status: 'pending' });
  await createTestIdea({ creator: user._id, title: 'Rejected one', status: 'rejected' });
  ideaA = String(a._id);
});

describe('GET /ideas', () => {
  it('lists approved ideas newest first with the exact DTO shape', async () => {
    const res = await request(app).get('/api/v1/ideas');
    expect(res.body).toMatchObject({ page: 1, pageSize: 24, total: 3 });
    expect(titles(res.body as Paginated<IdeaDTO>)).toEqual([
      'Cook pasta',
      'Hike a hill',
      'Sushi night',
    ]);
    expect((res.body as Paginated<IdeaDTO>).items[0]).toEqual({
      id: expect.any(String) as string,
      title: 'Cook pasta',
      description: expect.any(String) as string,
      image: null,
      tags: [{ id: expect.any(String) as string, name: 'food', slug: 'food', icon: 'tag' }],
      placeType: 'park',
      budget: 1,
      duration: 'short',
      status: 'approved',
      ratingAvg: 0,
      ratingCount: 0,
      saveCount: 0,
      creator: { id: String(user._id), name: user.name },
      createdAt: expect.any(String) as string,
      myRating: null,
      saved: false,
    });
  });

  it('filters by tag, budget, duration and search', async () => {
    expect((await list('?tag=food')).total).toBe(2);
    expect(await list('?tag=no-such-tag')).toMatchObject({ total: 0, items: [] });
    expect(titles(await list('?budget=2&duration=half-day'))).toEqual(['Sushi night']);
    expect((await list('?q=SUSH')).total).toBe(1);
  });

  it('treats q as literal text', async () => {
    for (const q of ['(', '.*', '[a-', '\\']) {
      const r = await request(app).get('/api/v1/ideas').query({ q });
      expect(r.status).toBe(200);
      expect((r.body as Paginated<IdeaDTO>).total).toBe(0);
    }
  });

  it('finds a title containing regex characters when searched literally', async () => {
    await createTestIdea({ creator: user._id, title: 'Picnic (with dessert)' });
    expect((await list('?q=(')).total).toBe(1);
    expect((await list('?q=.*')).total).toBe(0);
  });

  it('sorts by top: average, then count', async () => {
    const stats = [
      ['Sushi night', 4.5, 2],
      ['Hike a hill', 4.5, 10],
      ['Cook pasta', 3, 1],
    ] as const;
    for (const [title, ratingAvg, ratingCount] of stats) {
      await IdeaModel.updateOne({ title }, { ratingAvg, ratingCount });
    }
    expect((await list('?sort=top')).items.map((i) => i.ratingCount)).toEqual([10, 2, 1]);
  });

  it('paginates', async () => {
    expect(await list('?pageSize=2&page=2')).toMatchObject({ page: 2, pageSize: 2, total: 3 });
    expect((await list('?pageSize=2&page=2')).items).toHaveLength(1);
    expect((await list('?page=99')).items).toEqual([]);
  });

  it('rejects an invalid sort with 422', async () => {
    expect((await request(app).get('/api/v1/ideas?sort=old')).status).toBe(422);
  });

  it('includes the viewer rating and saved flag, and rounds ratingAvg', async () => {
    await RatingModel.create({ idea: ideaA, user: user._id, value: 4 });
    await SaveModel.create({ idea: ideaA, user: user._id });
    await IdeaModel.updateOne({ _id: ideaA }, { ratingAvg: 13 / 3, ratingCount: 3 });
    const mine = await request(app).get('/api/v1/ideas').set('Cookie', cookie);
    const items = (mine.body as Paginated<IdeaDTO>).items;
    expect(items.find((i) => i.id === ideaA)).toMatchObject({
      myRating: 4,
      saved: true,
      ratingAvg: 4.3,
    });
    expect(items.filter((i) => i.id !== ideaA).every((i) => i.myRating === null && !i.saved)).toBe(
      true,
    );
  });

  it('shows a deleted creator as Former member', async () => {
    const ghost = await createTestUser();
    const idea = await createTestIdea({ creator: ghost.user._id, title: 'Ghost idea' });
    await ghost.user.deleteOne();
    const found = (await list()).items.find((i) => i.id === String(idea._id));
    expect(found?.creator).toEqual({ id: String(ghost.user._id), name: 'Former member' });
  });

  it('ignores an invalid session cookie on public routes', async () => {
    const expired = jwt.sign({ sub: String(user._id), role: 'user' }, testEnv().JWT_SECRET, {
      expiresIn: -10,
    });
    for (const c of ['itsadate_session=garbage', `itsadate_session=${expired}`]) {
      expect((await request(app).get('/api/v1/ideas').set('Cookie', c)).status).toBe(200);
      expect((await request(app).get(`/api/v1/ideas/${ideaA}`).set('Cookie', c)).status).toBe(200);
    }
  });
});
