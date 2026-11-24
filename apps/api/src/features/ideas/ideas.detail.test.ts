import { Types } from 'mongoose';
import request from 'supertest';
import type { IdeaDTO } from '@itsadate/shared';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { createTestUser } from '../../test/auth.js';
import { useTestDb } from '../../test/db.js';
import { testEnv } from '../../test/env.js';
import { createTestIdea, createTestTag } from '../../test/factories.js';

useTestDb();

const app = createApp({ env: testEnv() });
const get = (id: string | Types.ObjectId) => request(app).get(`/api/v1/ideas/${String(id)}`);

async function seed() {
  const creator = await createTestUser();
  const other = await createTestUser();
  const admin = await createTestUser({ role: 'admin' });
  const approved = await createTestIdea({ creator: creator.user._id });
  const pending = await createTestIdea({ creator: creator.user._id, status: 'pending' });
  const rejected = await createTestIdea({ creator: creator.user._id, status: 'rejected' });
  return { creator, other, admin, approved, pending, rejected };
}

describe('GET /ideas/:id', () => {
  it('shows approved ideas to everyone', async () => {
    const { approved } = await seed();
    expect((await get(approved._id)).status).toBe(200);
  });

  it('hides pending ideas from anonymous visitors and other users', async () => {
    const { pending, other } = await seed();
    expect((await get(pending._id)).status).toBe(404);
    expect((await get(pending._id).set('Cookie', other.cookie)).status).toBe(404);
  });

  it('hides rejected ideas from anonymous visitors and other users', async () => {
    const { rejected, other } = await seed();
    expect((await get(rejected._id)).status).toBe(404);
    expect((await get(rejected._id).set('Cookie', other.cookie)).status).toBe(404);
  });

  it('shows pending to the creator and rejected to an admin', async () => {
    const { pending, rejected, creator, admin } = await seed();
    const own = await get(pending._id).set('Cookie', creator.cookie);
    expect((own.body as IdeaDTO).status).toBe('pending');
    expect((await get(rejected._id).set('Cookie', admin.cookie)).status).toBe(200);
  });

  it('returns 422 for a malformed id and 404 for an unknown one', async () => {
    expect((await get('xyz')).status).toBe(422);
    expect((await get(new Types.ObjectId())).body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Idea not found' },
    });
  });

  it('drops tags that no longer exist instead of failing', async () => {
    const { creator } = await seed();
    const tag = await createTestTag();
    const idea = await createTestIdea({
      creator: creator.user._id,
      tags: [tag._id, new Types.ObjectId()],
    });
    const res = await get(idea._id);
    expect(res.status).toBe(200);
    expect((res.body as IdeaDTO).tags.map((t) => t.id)).toEqual([String(tag._id)]);
  });
});
