import { z } from 'zod';

export const tagCreateSchema = z.object({
  name: z.string().trim().min(2).max(30),
  icon: z.string().min(1).max(40),
});

export const tagUpdateSchema = tagCreateSchema.partial();

export type TagCreateInput = z.infer<typeof tagCreateSchema>;
export type TagUpdateInput = z.infer<typeof tagUpdateSchema>;
