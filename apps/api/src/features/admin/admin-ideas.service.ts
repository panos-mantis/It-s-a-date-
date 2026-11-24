import type { AdminIdeaQuery, IdeaDTO, IdeaUpdateInput, Paginated } from '@itsadate/shared';
import type { Types } from 'mongoose';
import type { Env } from '../../config/env.js';
import { notFound } from '../../lib/errors.js';
import type { AuthContext } from '../../types/auth.js';
import { toIdeaDTOs } from '../ideas/ideas.mapper.js';
import { ideasRepository } from '../ideas/ideas.repository.js';
import { ideasService } from '../ideas/ideas.service.js';
import { ratingsRepository } from '../ratings/ratings.repository.js';
import { savesRepository } from '../saves/saves.repository.js';

export const adminIdeasService = {
  /** The pending queue is oldest first; other statuses are newest first. */
  async list(query: AdminIdeaQuery, admin: AuthContext): Promise<Paginated<IdeaDTO>> {
    const { page, pageSize, status } = query;
    const { items, total } = await ideasRepository.find(
      { status },
      status === 'pending' ? 'oldest' : 'new',
      page,
      pageSize,
    );
    return { items: await toIdeaDTOs(items, admin.userId), page, pageSize, total };
  },

  async update(id: string, input: IdeaUpdateInput, admin: AuthContext, env: Env): Promise<IdeaDTO> {
    if (!(await ideasRepository.findById(id))) throw notFound('Idea not found');
    await ideasService.assertIdeaInput(input, env);
    const { tagIds, ...rest } = input;
    const patch = tagIds ? { ...rest, tags: tagIds as unknown as Types.ObjectId[] } : rest;
    if (!(await ideasRepository.update(id, patch))) throw notFound('Idea not found');
    const idea = await ideasRepository.findById(id);
    if (!idea) throw notFound('Idea not found');
    const [dto] = await toIdeaDTOs([idea], admin.userId);
    return dto!;
  },

  async remove(id: string): Promise<void> {
    if (!(await ideasRepository.remove(id))) throw notFound('Idea not found');
    await Promise.all([ratingsRepository.deleteForIdea(id), savesRepository.deleteForIdea(id)]);
  },
};
