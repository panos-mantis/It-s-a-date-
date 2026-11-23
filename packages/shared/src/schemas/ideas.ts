import { z } from 'zod';
import { DURATIONS, IDEA_STATUSES, PLACE_TYPES, SORTS } from '../constants.js';
import { budgetSchema, objectIdSchema, paginationSchema } from './common.js';

export const imageSchema = z.object({
  url: z.url(),
  publicId: z.string().min(1).max(200),
});

export const ideaCreateSchema = z.object({
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().min(20).max(2000),
  image: imageSchema,
  tagIds: z.array(objectIdSchema).min(1).max(3),
  placeType: z.enum(PLACE_TYPES),
  budget: budgetSchema,
  duration: z.enum(DURATIONS),
});

export const ideaUpdateSchema = ideaCreateSchema.partial().extend({
  status: z.enum(IDEA_STATUSES).optional(),
});

export const ideaQuerySchema = paginationSchema.extend({
  q: z.string().trim().min(1).max(100).optional(),
  tag: z
    .string()
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  budget: budgetSchema.optional(),
  duration: z.enum(DURATIONS).optional(),
  sort: z.enum(SORTS).default('new'),
});

export type IdeaCreateInput = z.infer<typeof ideaCreateSchema>;
export type IdeaUpdateInput = z.infer<typeof ideaUpdateSchema>;
export type IdeaQuery = z.infer<typeof ideaQuerySchema>;
