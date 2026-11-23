import express, { Router, type Express } from 'express';
import type { ApiErrorBody } from '@itsadate/shared';

export function createApp(): Express {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Phase 2 mounts the real routes here.
  const v1 = Router();
  app.use('/api/v1', v1);

  app.use((_req, res) => {
    const body: ApiErrorBody = { error: { code: 'NOT_FOUND', message: 'Route not found' } };
    res.status(404).json(body);
  });

  return app;
}
