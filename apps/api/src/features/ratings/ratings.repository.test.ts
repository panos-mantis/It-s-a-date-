import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { RatingModel } from '../../models/rating.js';
import { useTestDb } from '../../test/db.js';
import { ratingsRepository } from './ratings.repository.js';

useTestDb();

describe('ratingsRepository', () => {
  it('computes stats, zero when there are no ratings', async () => {
    const idea = new Types.ObjectId();
    const id = String(idea);
    expect(await ratingsRepository.statsForIdea(id)).toEqual({ avg: 0, count: 0 });
    for (const value of [5, 4, 4]) {
      await RatingModel.create({ idea, user: new Types.ObjectId(), value });
    }
    expect(await ratingsRepository.statsForIdea(id)).toEqual({ avg: 13 / 3, count: 3 });
  });

  it('returns only the given user ratings for the given ideas', async () => {
    const [a, b] = [new Types.ObjectId(), new Types.ObjectId()];
    const user = new Types.ObjectId();
    await RatingModel.create({ idea: a, user, value: 3 });
    await RatingModel.create({ idea: b, user: new Types.ObjectId(), value: 5 });
    const map = await ratingsRepository.valuesForUser(String(user), [String(a), String(b)]);
    expect([...map]).toEqual([[String(a), 3]]);
    await ratingsRepository.deleteForIdea(String(a));
    expect(await ratingsRepository.statsForIdea(String(a))).toEqual({ avg: 0, count: 0 });
  });
});
