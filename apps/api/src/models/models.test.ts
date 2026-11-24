import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { useTestDb } from '../test/db.js';
import { IdeaModel, RatingModel, SaveModel, UserModel } from './index.js';

useTestDb();

const oid = () => new Types.ObjectId();
const ideaInput = () => ({
  title: 'Picnic at the park',
  description: 'Bring a blanket and snacks',
  creator: oid(),
});

describe('UserModel', () => {
  it('normalises email, defaults role and hides passwordHash', async () => {
    await UserModel.create({ name: 'Ana', email: ' Ana@X.com ', passwordHash: 'h' });
    const found = await UserModel.findOne({ email: 'ana@x.com' });
    expect(found?.role).toBe('user');
    expect(found?.passwordHash).toBeUndefined();
    const withHash = await UserModel.findOne({ email: 'ana@x.com' }).select('+passwordHash');
    expect(withHash?.passwordHash).toBe('h');
  });

  it('rejects duplicate emails', async () => {
    await UserModel.create({ name: 'Ana', email: 'ana@x.com', passwordHash: 'h' });
    await expect(
      UserModel.create({ name: 'B', email: 'ana@x.com', passwordHash: 'h' }),
    ).rejects.toMatchObject({ code: 11000 });
  });
});

describe('IdeaModel', () => {
  it('rejects invalid budget and status', async () => {
    await expect(IdeaModel.create({ ...ideaInput(), budget: 4 })).rejects.toThrow();
    await expect(IdeaModel.create({ ...ideaInput(), status: 'approved-ish' })).rejects.toThrow();
  });

  it('applies defaults', async () => {
    const idea = await IdeaModel.create(ideaInput());
    expect(idea.toObject()).toMatchObject({
      status: 'pending',
      budget: null,
      duration: null,
      image: null,
      placeType: 'none',
      ratingAvg: 0,
      ratingCount: 0,
      saveCount: 0,
    });
  });

  it('has the indexes from the spec', async () => {
    const keys = Object.values(await IdeaModel.collection.indexInformation());
    expect(keys).toEqual(
      expect.arrayContaining([
        [
          ['status', 1],
          ['createdAt', -1],
        ],
        [
          ['status', 1],
          ['ratingAvg', -1],
        ],
        [['tags', 1]],
        [['budget', 1]],
        [['duration', 1]],
        [
          ['creator', 1],
          ['createdAt', -1],
        ],
        [['seedKey', 1]],
      ]),
    );
  });
});

describe('RatingModel', () => {
  it('allows one rating per user and idea, with value 1..5', async () => {
    const [i, u, u2] = [oid(), oid(), oid()];
    await RatingModel.create({ idea: i, user: u, value: 4 });
    await expect(RatingModel.create({ idea: i, user: u, value: 5 })).rejects.toMatchObject({
      code: 11000,
    });
    await expect(RatingModel.create({ idea: i, user: u2, value: 6 })).rejects.toThrow();
    await expect(RatingModel.create({ idea: i, user: u2, value: 2.5 })).rejects.toThrow();
  });
});

describe('SaveModel', () => {
  it('allows one save per user and idea', async () => {
    const [i, u] = [oid(), oid()];
    await expect(
      SaveModel.create([
        { user: u, idea: i },
        { user: u, idea: i },
      ]),
    ).rejects.toMatchObject({ code: 11000 });
  });
});
