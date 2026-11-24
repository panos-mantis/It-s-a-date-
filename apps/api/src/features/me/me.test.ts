import request from 'supertest';
import type { IdeaDTO, Paginated } from '@itsadate/shared';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { createTestUser } from '../../test/auth.js';
import { useTestDb } from '../../test/db.js';
import { testEnv } from '../../test/env.js';
import { createTestIdea } from '../../test/factories.js';

useTestDb();

const app = createApp({ env: testEnv() });

describe('GET /me/ideas', () => {
  it("lists the viewer's ideas of every status, newest first", async () => {
    const { user, cookie } = await createTestUser();
    const other = await createTestUser();
    const base = Date.now() - 10_000;
    const mine = user._id;
    await createTestIdea({ creator: mine, status: 'approved', createdAt: new Date(base) });
    await createTestIdea({ creator: mine, status: 'pending', createdAt: new Date(base + 1000) });
    await createTestIdea({ creator: mine, status: 'rejected', createdAt: new Date(base + 2000) });
    await createTestIdea({ creator: other.user._id });
    const res = await request(app).get('/api/v1/me/ideas').set('Cookie', cookie);
    const body = res.body as Paginated<IdeaDTO>;
    expect(res.status).toBe(200);
    expect(body.total).toBe(3);
    expect(body.items.map((i) => i.status)).toEqual(['rejected', 'pending', 'approved']);
  });

  it('requires login', async () => {
    expect((await request(app).get('/api/v1/me/ideas')).status).toBe(401);
  });

  it('validates pagination', async () => {
    const { cookie } = await createTestUser();
    const res = await request(app).get('/api/v1/me/ideas?pageSize=100').set('Cookie', cookie);
    expect(res.status).toBe(422);
  });
});
