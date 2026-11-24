import { SaveModel } from '../../models/save.js';

export const savesRepository = {
  /** Which of the given ideas the user has saved. */
  async savedIdeaIds(userId: string, ideaIds: string[]): Promise<Set<string>> {
    if (ideaIds.length === 0) return new Set();
    const rows = await SaveModel.find({ user: userId, idea: { $in: ideaIds } }).exec();
    return new Set(rows.map((s) => String(s.idea)));
  },

  countForIdea(ideaId: string): Promise<number> {
    return SaveModel.countDocuments({ idea: ideaId }).exec();
  },

  async deleteForIdea(ideaId: string): Promise<void> {
    await SaveModel.deleteMany({ idea: ideaId }).exec();
  },
};
