import type { TagCreateInput, TagUpdateInput } from '@itsadate/shared';
import { conflict, notFound } from '../../lib/errors.js';
import { slugify } from '../../lib/slug.js';
import type { TagDoc } from '../../models/tag.js';
import { tagsRepository } from './tags.repository.js';

const NAME_TAKEN = 'A tag with this name already exists';

const isDuplicateKey = (err: unknown) => (err as { code?: unknown } | null)?.code === 11000;

export const tagsService = {
  list(): Promise<TagDoc[]> {
    return tagsRepository.listAll();
  },

  async create(input: TagCreateInput): Promise<TagDoc> {
    const slug = slugify(input.name);
    if (await tagsRepository.findBySlug(slug)) throw conflict(NAME_TAKEN);
    try {
      return await tagsRepository.create({ name: input.name, slug, icon: input.icon });
    } catch (err) {
      if (isDuplicateKey(err)) throw conflict(NAME_TAKEN);
      throw err;
    }
  },

  async update(id: string, input: TagUpdateInput): Promise<TagDoc> {
    const patch: { name?: string; slug?: string; icon?: string } = {};
    if (input.icon !== undefined) patch.icon = input.icon;
    if (input.name !== undefined) {
      patch.name = input.name;
      patch.slug = slugify(input.name);
      const clash = await tagsRepository.findBySlug(patch.slug);
      if (clash && clash.id !== id) throw conflict(NAME_TAKEN);
    }
    try {
      const tag = await tagsRepository.update(id, patch);
      if (!tag) throw notFound('Tag not found');
      return tag;
    } catch (err) {
      if (isDuplicateKey(err)) throw conflict(NAME_TAKEN);
      throw err;
    }
  },

  async remove(id: string): Promise<void> {
    if (!(await tagsRepository.remove(id))) throw notFound('Tag not found');
  },
};
