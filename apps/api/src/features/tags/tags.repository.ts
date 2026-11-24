import { IdeaModel } from '../../models/idea.js';
import { TagModel, type TagDoc } from '../../models/tag.js';

export const tagsRepository = {
  listAll(): Promise<TagDoc[]> {
    return TagModel.find().sort({ name: 1, _id: 1 }).exec();
  },

  findBySlug(slug: string): Promise<TagDoc | null> {
    return TagModel.findOne({ slug }).exec();
  },

  findById(id: string): Promise<TagDoc | null> {
    return TagModel.findById(id).exec();
  },

  /** The subset of `ids` that exist as tags. */
  async findExistingIds(ids: string[]): Promise<string[]> {
    const found = await TagModel.find({ _id: { $in: ids } }, { _id: 1 }).exec();
    return found.map((t) => t.id as string);
  },

  create(input: { name: string; slug: string; icon: string }): Promise<TagDoc> {
    return TagModel.create(input);
  },

  update(
    id: string,
    patch: { name?: string; slug?: string; icon?: string },
  ): Promise<TagDoc | null> {
    return TagModel.findByIdAndUpdate(id, patch, { new: true }).exec();
  },

  /** Deletes the tag and removes it from every idea. Returns false if it did not exist. */
  async remove(id: string): Promise<boolean> {
    // Pull first: a failure between the steps must not leave dangling tag ids on ideas.
    await IdeaModel.updateMany({ tags: id }, { $pull: { tags: id } }).exec();
    return (await TagModel.findByIdAndDelete(id).exec()) !== null;
  },
};
