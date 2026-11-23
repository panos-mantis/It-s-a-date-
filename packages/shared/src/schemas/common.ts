import { z } from 'zod';
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX, BUDGETS } from '../constants.js';

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

/** Query-string values: `''`, whitespace-only strings and `null` mean "absent". */
export const emptyToUndefined = (value: unknown): unknown =>
  value === null || (typeof value === 'string' && value.trim() === '') ? undefined : value;

/** A number, or a string of decimal digits only (no hex, exponent, sign or whitespace). */
export const decimalIntegerSchema = z
  .union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
  .pipe(z.number().int());

/** A number, or a decimal string with optional sign and fraction (no hex or exponent). */
export const decimalNumberSchema = z
  .union([
    z.number(),
    z
      .string()
      .regex(/^[+-]?\d+(?:\.\d+)?$/)
      .transform(Number),
  ])
  .pipe(z.number());

export const paginationSchema = z.object({
  page: z.preprocess(emptyToUndefined, decimalIntegerSchema.pipe(z.number().min(1)).default(1)),
  pageSize: z.preprocess(
    emptyToUndefined,
    decimalIntegerSchema.pipe(z.number().min(1).max(PAGE_SIZE_MAX)).default(PAGE_SIZE_DEFAULT),
  ),
});

/** Accepts `2` or `'2'`, then only a valid budget; output type is `Budget`. */
export const budgetSchema = decimalIntegerSchema.pipe(
  z.union([z.literal(BUDGETS[0]), z.literal(BUDGETS[1]), z.literal(BUDGETS[2])]),
);
