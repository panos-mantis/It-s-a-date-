import type { Budget, Duration, IdeaStatus } from '@itsadate/shared';
import type { FilterQuery, SortOrder, Types } from 'mongoose';
import { escapeRegex } from '../../lib/regex.js';
import { IdeaModel, type IIdea, type IdeaDoc } from '../../models/idea.js';
import type { TagDoc } from '../../models/tag.js';

export interface IdeaFilter {
  status?: IdeaStatus;
  tagId?: string;
  budget?: Budget;
  duration?: Duration;
  q?: string;
  creatorId?: string;
}

export type IdeaSort = 'new' | 'top' | 'oldest';

/** An idea with `tags` and `creator` populated. `creator` is null if the user is gone. */
export type PopulatedIdea = Omit<IdeaDoc, 'tags' | 'creator'> & {
  tags: TagDoc[];
  creator: { _id: Types.ObjectId; name: string } | null;
};

const SORTS: Record<IdeaSort, Record<string, SortOrder>> = {
  new: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  top: { ratingAvg: -1, ratingCount: -1, createdAt: -1, _id: -1 },
};

function toQuery(f: IdeaFilter): FilterQuery<IIdea> {
  const query: FilterQuery<IIdea> = {};
  if (f.status) query.status = f.status;
  if (f.tagId) query.tags = f.tagId;
  if (f.budget) query.budget = f.budget;
  if (f.duration) query.duration = f.duration;
  if (f.creatorId) query.creator = f.creatorId;
  if (f.q) {
    const rx = { $regex: escapeRegex(f.q), $options: 'i' };
    query.$or = [{ title: rx }, { description: rx }];
  }
  return query;
}

/** The stored creator id, even when the user no longer exists. */
export function creatorIdOf(doc: PopulatedIdea): string {
  if (doc.creator) return String(doc.creator._id);
  const stored = (doc as unknown as IdeaDoc).populated('creator') as Types.ObjectId | undefined;
  return stored ? stored.toHexString() : '';
}

export const ideasRepository = {
  async find(
    filter: IdeaFilter,
    sort: IdeaSort,
    page: number,
    pageSize: number,
  ): Promise<{ items: PopulatedIdea[]; total: number }> {
    const query = toQuery(filter);
    const [items, total] = await Promise.all([
      IdeaModel.find(query)
        .sort(SORTS[sort])
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate('tags')
        .populate('creator', 'name')
        .exec(),
      IdeaModel.countDocuments(query).exec(),
    ]);
    return { items: items as unknown as PopulatedIdea[], total };
  },

  async findById(id: string): Promise<PopulatedIdea | null> {
    const doc = await IdeaModel.findById(id).populate('tags').populate('creator', 'name').exec();
    return doc as unknown as PopulatedIdea | null;
  },

  create(attrs: Partial<IIdea>): Promise<IdeaDoc> {
    return IdeaModel.create(attrs);
  },

  update(id: string, patch: Partial<IIdea>): Promise<IdeaDoc | null> {
    return IdeaModel.findByIdAndUpdate(id, patch, { new: true }).exec();
  },

  async remove(id: string): Promise<boolean> {
    return (await IdeaModel.findByIdAndDelete(id).exec()) !== null;
  },

  async setRatingStats(id: string, stats: { avg: number; count: number }): Promise<void> {
    await IdeaModel.updateOne(
      { _id: id },
      { ratingAvg: stats.avg, ratingCount: stats.count },
    ).exec();
  },

  async setSaveCount(id: string, n: number): Promise<void> {
    await IdeaModel.updateOne({ _id: id }, { saveCount: n }).exec();
  },
};
