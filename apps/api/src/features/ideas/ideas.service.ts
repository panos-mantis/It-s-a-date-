import type { IdeaDTO, IdeaQuery, Paginated } from '@itsadate/shared';
import { notFound } from '../../lib/errors.js';
import type { AuthContext } from '../../types/auth.js';
import { tagsRepository } from '../tags/tags.repository.js';
import { toIdeaDTOs } from './ideas.mapper.js';
import { creatorIdOf, ideasRepository } from './ideas.repository.js';

export const ideasService = {
  async listApproved(query: IdeaQuery, viewer?: AuthContext): Promise<Paginated<IdeaDTO>> {
    const { page, pageSize } = query;
    let tagId: string | undefined;
    if (query.tag) {
      const tag = await tagsRepository.findBySlug(query.tag);
      if (!tag) return { items: [], page, pageSize, total: 0 };
      tagId = tag.id as string;
    }
    const { items, total } = await ideasRepository.find(
      {
        status: 'approved',
        tagId,
        budget: query.budget,
        duration: query.duration,
        q: query.q,
      },
      query.sort,
      page,
      pageSize,
    );
    return { items: await toIdeaDTOs(items, viewer?.userId), page, pageSize, total };
  },

  /** Approved ideas are public; others only to their creator or an admin. */
  async getVisible(id: string, viewer?: AuthContext): Promise<IdeaDTO> {
    const idea = await ideasRepository.findById(id);
    if (!idea) throw notFound('Idea not found');
    const allowed =
      idea.status === 'approved' ||
      (viewer !== undefined && (viewer.role === 'admin' || viewer.userId === creatorIdOf(idea)));
    if (!allowed) throw notFound('Idea not found');
    const [dto] = await toIdeaDTOs([idea], viewer?.userId);
    return dto!;
  },
};
