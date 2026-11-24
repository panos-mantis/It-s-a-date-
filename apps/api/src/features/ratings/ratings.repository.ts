import { Types } from 'mongoose';
import { RatingModel } from '../../models/rating.js';

export const ratingsRepository = {
  /** The viewer's rating value per idea id, for the given ideas only. */
  async valuesForUser(userId: string, ideaIds: string[]): Promise<Map<string, number>> {
    if (ideaIds.length === 0) return new Map();
    const rows = await RatingModel.find({ user: userId, idea: { $in: ideaIds } }).exec();
    return new Map(rows.map((r) => [String(r.idea), r.value]));
  },

  async statsForIdea(ideaId: string): Promise<{ avg: number; count: number }> {
    const [row] = await RatingModel.aggregate<{ avg: number; count: number }>([
      { $match: { idea: new Types.ObjectId(ideaId) } },
      { $group: { _id: null, avg: { $avg: '$value' }, count: { $sum: 1 } } },
    ]).exec();
    return row ? { avg: row.avg, count: row.count } : { avg: 0, count: 0 };
  },

  async deleteForIdea(ideaId: string): Promise<void> {
    await RatingModel.deleteMany({ idea: ideaId }).exec();
  },
};
