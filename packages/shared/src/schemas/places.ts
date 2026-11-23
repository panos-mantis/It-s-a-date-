import { z } from 'zod';
import { PLACES_RADIUS_DEFAULT_M, PLACES_RADIUS_MAX_M } from '../constants.js';
import { objectIdSchema } from './common.js';

export const placesQuerySchema = z.object({
  ideaId: objectIdSchema,
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce
    .number()
    .int()
    .min(500)
    .max(PLACES_RADIUS_MAX_M)
    .default(PLACES_RADIUS_DEFAULT_M),
});

export const geocodeQuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
});

export type PlacesQuery = z.infer<typeof placesQuerySchema>;
export type GeocodeQuery = z.infer<typeof geocodeQuerySchema>;
