import { describe, expect, it } from 'vitest';
import { geocodeQuerySchema, placesQuerySchema } from './places.js';

const id = '64d74918b329db37043bef9e';

describe('places schemas', () => {
  it('defaults the radius', () => {
    expect(placesQuerySchema.parse({ ideaId: id, lat: '37.98', lng: '23.72' }).radius).toBe(3000);
  });
  it('rejects out-of-range coordinates and radius', () => {
    expect(placesQuerySchema.safeParse({ ideaId: id, lat: '91', lng: '0' }).success).toBe(false);
    expect(
      placesQuerySchema.safeParse({ ideaId: id, lat: '0', lng: '0', radius: '20000' }).success,
    ).toBe(false);
    expect(
      placesQuerySchema.safeParse({ ideaId: id, lat: '0', lng: '0', radius: '100' }).success,
    ).toBe(false);
  });
  it('validates geocode query', () => {
    expect(geocodeQuerySchema.parse({ q: ' Athens ' })).toEqual({ q: 'Athens' });
    expect(geocodeQuerySchema.safeParse({ q: 'a' }).success).toBe(false);
  });
});
