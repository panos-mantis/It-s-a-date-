import { Types } from 'mongoose';
import request from 'supertest';
import type { IdeaDTO, Paginated } from '@itsadate/shared';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { IdeaModel } from '../../models/idea.js';
import { createTestUser } from '../../test/auth.js';
import { useTestDb } from '../../test/db.js';
import { testEnv } from '../../test/env.js';
import { createTestTag } from '../../test/factories.js';

useTestDb();

const app = createApp({ env: testEnv({ CLOUDINARY_CLOUD_NAME: 'demo' }) });
const ok = {
  url: 'https://res.cloudinary.com/demo/image/upload/v1712/itsadate/dev/ab12cd.jpg',
  publicId: 'itsadate/dev/ab12cd',
};

interface Issues {
  error: { details: { issues: { location: string; path: string }[] } };
}

async function setup() {
  const { user, cookie } = await createTestUser();
  const other = await createTestUser();
  const tag = await createTestTag();
  const body = {
    title: 'Pottery for two',
    description: 'Book a beginner wheel class and make a lopsided mug each.',
    image: ok,
    tagIds: [String(tag._id)],
    placeType: 'none',
    budget: 2,
    duration: 'short',
  };
  return { user, cookie, other, body };
}

describe('POST /ideas', () => {
  it('creates a pending idea owned by the viewer, hidden from the public list', async () => {
    const { user, cookie, body } = await setup();
    const res = await request(app).post('/api/v1/ideas').set('Cookie', cookie).send(body);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      status: 'pending',
      budget: 2,
      creator: { id: String(user._id) },
      image: ok,
    });
    const pub = await request(app).get('/api/v1/ideas');
    expect((pub.body as Paginated<IdeaDTO>).total).toBe(0);
  });

  it('requires login', async () => {
    const { body } = await setup();
    expect((await request(app).post('/api/v1/ideas').send(body)).status).toBe(401);
  });

  it('rejects invalid input with 422', async () => {
    const { cookie, body } = await setup();
    const res = await request(app)
      .post('/api/v1/ideas')
      .set('Cookie', cookie)
      .send({ ...body, budget: 7 });
    expect(res.status).toBe(422);
  });

  it('rejects unknown tags', async () => {
    const { cookie, body } = await setup();
    const res = await request(app)
      .post('/api/v1/ideas')
      .set('Cookie', cookie)
      .send({ ...body, tagIds: [String(new Types.ObjectId())] });
    expect(res.status).toBe(422);
    expect((res.body as Issues).error.details.issues[0]).toMatchObject({
      location: 'body',
      path: 'tagIds',
    });
  });

  it('rejects images that were not uploaded through us', async () => {
    const { cookie, body } = await setup();
    const res = await request(app)
      .post('/api/v1/ideas')
      .set('Cookie', cookie)
      .send({ ...body, image: { url: 'https://i.imgur.com/x.jpg', publicId: 'x' } });
    expect(res.status).toBe(422);
    expect((res.body as Issues).error.details.issues[0]).toMatchObject({
      location: 'body',
      path: 'image',
    });
  });

  it('ignores status and creator in the body', async () => {
    const { user, other, cookie, body } = await setup();
    const res = await request(app)
      .post('/api/v1/ideas')
      .set('Cookie', cookie)
      .send({ ...body, status: 'approved', creator: String(other.user._id) });
    expect(res.body).toMatchObject({ status: 'pending', creator: { id: String(user._id) } });
    expect(await IdeaModel.countDocuments({ status: 'approved' })).toBe(0);
  });
});
