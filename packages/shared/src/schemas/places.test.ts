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

describe('places schemas empty and strict values', () => {
  it('rejects empty or null coordinates', () => {
    expect(placesQuerySchema.safeParse({ ideaId: id, lat: '', lng: '' }).success).toBe(false);
    expect(placesQuerySchema.safeParse({ ideaId: id, lat: null, lng: null }).success).toBe(false);
    expect(placesQuerySchema.safeParse({ ideaId: id, lat: '0', lng: '' }).success).toBe(false);
  });
  it('treats empty radius as default', () => {
    expect(placesQuerySchema.parse({ ideaId: id, lat: '1', lng: '2', radius: '' }).radius).toBe(
      3000,
    );
  });
  it('accepts signed decimals, rejects exponent/hex', () => {
    expect(placesQuerySchema.parse({ ideaId: id, lat: '-37.5', lng: '+23.7' })).toMatchObject({
      lat: -37.5,
      lng: 23.7,
    });
    expect(placesQuerySchema.safeParse({ ideaId: id, lat: '1e1', lng: '0' }).success).toBe(false);
    expect(placesQuerySchema.safeParse({ ideaId: id, lat: '0x10', lng: '0' }).success).toBe(false);
  });
});
