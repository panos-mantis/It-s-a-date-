import { z } from 'zod';
import { PLACES_RADIUS_DEFAULT_M, PLACES_RADIUS_MAX_M } from '../constants.js';
import {
  decimalIntegerSchema,
  decimalNumberSchema,
  emptyToUndefined,
  objectIdSchema,
} from './common.js';

export const placesQuerySchema = z.object({
  ideaId: objectIdSchema,
  lat: z.preprocess(emptyToUndefined, decimalNumberSchema.pipe(z.number().min(-90).max(90))),
  lng: z.preprocess(emptyToUndefined, decimalNumberSchema.pipe(z.number().min(-180).max(180))),
  radius: z.preprocess(
    emptyToUndefined,
    decimalIntegerSchema
      .pipe(z.number().min(500).max(PLACES_RADIUS_MAX_M))
      .default(PLACES_RADIUS_DEFAULT_M),
  ),
});

export const geocodeQuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
});

export type PlacesQuery = z.infer<typeof placesQuerySchema>;
export type GeocodeQuery = z.infer<typeof geocodeQuerySchema>;
