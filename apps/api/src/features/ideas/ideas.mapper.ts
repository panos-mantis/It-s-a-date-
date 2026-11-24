import type { IdeaDTO } from '@itsadate/shared';
import { ratingsRepository } from '../ratings/ratings.repository.js';
import { savesRepository } from '../saves/saves.repository.js';
import { toTagDTO } from '../tags/tags.mapper.js';
import { creatorIdOf, type PopulatedIdea } from './ideas.repository.js';

/** Builds IdeaDTOs; with a viewer, myRating and saved come from two batched lookups. */
export async function toIdeaDTOs(docs: PopulatedIdea[], viewerId?: string): Promise<IdeaDTO[]> {
  const ids = docs.map((d) => String(d._id));
  const [ratings, saved] = viewerId
    ? await Promise.all([
        ratingsRepository.valuesForUser(viewerId, ids),
        savesRepository.savedIdeaIds(viewerId, ids),
      ])
    : [new Map<string, number>(), new Set<string>()];

  return docs.map((doc) => {
    const id = String(doc._id);
    return {
      id,
      title: doc.title,
      description: doc.description,
      image: doc.image ? { url: doc.image.url, publicId: doc.image.publicId } : null,
      // A tag deleted concurrently can leave an unresolved (null) entry.
      tags: (doc.tags as (PopulatedIdea['tags'][number] | null)[])
        .filter((t) => t != null)
        .map(toTagDTO),
      placeType: doc.placeType,
      budget: doc.budget,
      duration: doc.duration,
      status: doc.status,
      ratingAvg: Math.round(doc.ratingAvg * 10) / 10,
      ratingCount: doc.ratingCount,
      saveCount: doc.saveCount,
      creator: doc.creator
        ? { id: String(doc.creator._id), name: doc.creator.name }
        : { id: creatorIdOf(doc), name: 'Former member' },
      createdAt: doc.createdAt.toISOString(),
      myRating: ratings.get(id) ?? null,
      saved: saved.has(id),
    };
  });
}
