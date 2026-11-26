import type { TagDTO } from '@itsadate/shared';

// Ids are 24-hex so they pass ideaCreateSchema's objectId check when posted back.
export const tagFixtures: TagDTO[] = [
  { id: '64a000000000000000000001', name: 'Food', slug: 'food', icon: 'utensils' },
  { id: '64a000000000000000000002', name: 'Adventure', slug: 'adventure', icon: 'mountain' },
  { id: '64a000000000000000000003', name: 'Home', slug: 'home', icon: 'house' },
  { id: '64a000000000000000000004', name: 'Self-date', slug: 'self-date', icon: 'heart' },
  { id: '64a000000000000000000005', name: 'Board games', slug: 'board-game', icon: 'dice-5' },
  { id: '64a000000000000000000006', name: 'Dancing', slug: 'dancing', icon: 'music' },
  { id: '64a000000000000000000007', name: 'Self-care', slug: 'self-care', icon: 'flower-2' },
  { id: '64a000000000000000000008', name: 'Learning', slug: 'learning', icon: 'book-open' },
];
