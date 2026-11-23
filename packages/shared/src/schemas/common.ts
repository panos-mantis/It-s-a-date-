import { z } from 'zod';
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX, BUDGETS } from '../constants.js';

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX).default(PAGE_SIZE_DEFAULT),
});

/** Coerces to a number, then accepts only a valid budget; output type is `Budget`. */
export const budgetSchema = z.coerce
  .number()
  .pipe(z.union([z.literal(BUDGETS[0]), z.literal(BUDGETS[1]), z.literal(BUDGETS[2])]));
