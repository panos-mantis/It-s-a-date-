import type { TagDTO } from '@itsadate/shared';
import type { TagDoc } from '../../models/tag.js';

export function toTagDTO(doc: TagDoc): TagDTO {
  return { id: doc.id as string, name: doc.name, slug: doc.slug, icon: doc.icon };
}
