import { z } from 'zod';
import { DURATIONS, IDEA_STATUSES, PLACE_TYPES, SORTS } from '../constants.js';
import { budgetSchema, emptyToUndefined, objectIdSchema, paginationSchema } from './common.js';

export const imageSchema = z.object({
  url: z.url({ protocol: /^https$/ }),
  publicId: z.string().min(1).max(200),
});

export const ideaCreateSchema = z.object({
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().min(20).max(2000),
  image: imageSchema,
  tagIds: z
    .array(objectIdSchema)
    .min(1)
    .max(3)
    .refine((ids) => new Set(ids).size === ids.length, { message: 'Duplicate tags' }),
  placeType: z.enum(PLACE_TYPES),
  budget: budgetSchema,
  duration: z.enum(DURATIONS),
});

export const ideaUpdateSchema = ideaCreateSchema.partial().extend({
  status: z.enum(IDEA_STATUSES).optional(),
});

export const ideaQuerySchema = paginationSchema.extend({
  q: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(100).optional()),
  tag: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .max(40)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
  ),
  budget: z.preprocess(emptyToUndefined, budgetSchema.optional()),
  duration: z.preprocess(emptyToUndefined, z.enum(DURATIONS).optional()),
  sort: z.preprocess(emptyToUndefined, z.enum(SORTS).default('new')),
});

export type IdeaCreateInput = z.infer<typeof ideaCreateSchema>;
export type IdeaUpdateInput = z.infer<typeof ideaUpdateSchema>;
export type IdeaQuery = z.infer<typeof ideaQuerySchema>;
