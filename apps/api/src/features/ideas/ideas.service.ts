import type { Types } from 'mongoose';
import type { IdeaCreateInput, IdeaDTO, IdeaQuery, Paginated } from '@itsadate/shared';
import type { Env } from '../../config/env.js';
import { notFound, validationError } from '../../lib/errors.js';
import { isOwnImage } from '../../lib/images.js';
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

  /** Checks what the schema cannot: our own image and existing tags. Throws a 422. */
  async assertIdeaInput(input: Partial<IdeaCreateInput>, env: Env): Promise<void> {
    const issues: { location: 'body'; path: string; message: string }[] = [];
    if (input.image && !isOwnImage(input.image, env)) {
      issues.push({
        location: 'body',
        path: 'image',
        message: "Use an image uploaded through It's a Date",
      });
    }
    if (input.tagIds) {
      const existing = new Set(await tagsRepository.findExistingIds(input.tagIds));
      if (input.tagIds.some((id) => !existing.has(id))) {
        issues.push({ location: 'body', path: 'tagIds', message: 'Unknown tag' });
      }
    }
    if (issues.length > 0) throw validationError({ issues });
  },

  async create(input: IdeaCreateInput, viewer: AuthContext, env: Env): Promise<IdeaDTO> {
    await ideasService.assertIdeaInput(input, env);
    const { tagIds, ...rest } = input;
    const created = await ideasRepository.create({
      ...rest,
      tags: tagIds as unknown as Types.ObjectId[],
      creator: viewer.userId as unknown as Types.ObjectId,
      status: 'pending',
    });
    const idea = await ideasRepository.findById(created.id as string);
    const [dto] = await toIdeaDTOs([idea!], viewer.userId);
    return dto!;
  },

  async listMine(
    page: { page: number; pageSize: number },
    viewer: AuthContext,
  ): Promise<Paginated<IdeaDTO>> {
    const { items, total } = await ideasRepository.find(
      { creatorId: viewer.userId },
      'new',
      page.page,
      page.pageSize,
    );
    return { items: await toIdeaDTOs(items, viewer.userId), ...page, total };
  },
};
