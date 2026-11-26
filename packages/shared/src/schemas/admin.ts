import { z } from 'zod';
import { IDEA_STATUSES, ROLES } from '../constants.js';
import { emptyToUndefined, paginationSchema } from './common.js';

export const adminIdeaQuerySchema = paginationSchema.extend({
  status: z.preprocess(emptyToUndefined, z.enum(IDEA_STATUSES).default('pending')),
  q: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(100).optional()),
});

export const adminUserQuerySchema = paginationSchema.extend({
  q: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(100).optional()),
});

export const roleUpdateSchema = z.object({ role: z.enum(ROLES) });

export type AdminIdeaQuery = z.infer<typeof adminIdeaQuerySchema>;
export type AdminUserQuery = z.infer<typeof adminUserQuerySchema>;
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;
