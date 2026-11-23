import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ideaQuerySchema, objectIdSchema, registerSchema } from '@itsadate/shared';
import { z } from 'zod';
import type { ValidationErrorDetails } from '@itsadate/shared';
import { errorOf, validatedOf } from '../test/http.js';
import { errorHandler } from './error.js';
import { validate } from './validate.js';

const idParams = z.object({ id: objectIdSchema });

function makeApp() {
  const app = express();
  app.use(express.json());
  app.get('/x', validate({ query: ideaQuerySchema }), (_req, res) => {
    res.json(res.locals.validated);
  });
  app.get('/p/:id', validate({ params: idParams }), (_req, res) => {
    res.json(res.locals.validated);
  });
  app.post('/x', validate({ body: registerSchema }), (_req, res) => {
    res.status(201).json(res.locals.validated);
  });
  app.use(errorHandler);
  return app;
}

describe('validate', () => {
  it('stores parsed query in res.locals.validated', async () => {
    const res = await request(makeApp()).get('/x?budget=2&page=3');
    expect(res.status).toBe(200);
    expect(validatedOf(res).query).toEqual({ budget: 2, page: 3, pageSize: 24, sort: 'new' });
  });

  it('validates params', async () => {
    const ok = await request(makeApp()).get('/p/507f1f77bcf86cd799439011');
    expect(validatedOf(ok).params).toEqual({ id: '507f1f77bcf86cd799439011' });
    const bad = await request(makeApp()).get('/p/nope');
    expect(bad.status).toBe(422);
    expect((errorOf(bad).details as ValidationErrorDetails).issues[0]).toMatchObject({
      location: 'params',
      path: 'id',
    });
  });

  it('answers 422 with located issues on invalid query', async () => {
    const res = await request(makeApp()).get('/x?budget=9');
    expect(res.status).toBe(422);
    expect(errorOf(res).code).toBe('VALIDATION');
    expect((errorOf(res).details as ValidationErrorDetails).issues[0]).toMatchObject({
      location: 'query',
      path: 'budget',
    });
  });

  it('reports every invalid body field', async () => {
    const res = await request(makeApp()).post('/x').send({ email: 'nope' });
    expect(res.status).toBe(422);
    const paths = (
      (errorOf(res).details as ValidationErrorDetails).issues as {
        location: string;
        path: string;
      }[]
    ).map((i) => `${i.location}.${i.path}`);
    expect(paths).toEqual(expect.arrayContaining(['body.name', 'body.email', 'body.password']));
  });

  it('treats a missing body as an empty object', async () => {
    const res = await request(makeApp()).post('/x');
    expect(res.status).toBe(422);
  });
});
