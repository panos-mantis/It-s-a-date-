import { randomUUID } from 'node:crypto';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Router, type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { Logger } from 'pino';
import type { ApiErrorBody } from '@itsadate/shared';
import type { Env } from './config/env.js';
import { createLogger } from './lib/logger.js';
import { errorHandler } from './middleware/error.js';

export interface AppDeps {
  env: Env;
  logger?: Logger;
  /** Test-only hook: mounted on /api/v1 before the 404. */
  extraRoutes?: (router: Router) => void;
}

const REQUEST_ID = /^[\w-]{1,64}$/;

export function createApp(deps: AppDeps): Express {
  const { env } = deps;
  const logger = deps.logger ?? createLogger(env);
  const app = express();

  app.set('trust proxy', env.TRUST_PROXY);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const incoming = req.headers['x-request-id'];
        const id =
          typeof incoming === 'string' && REQUEST_ID.test(incoming) ? incoming : randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Later tasks mount the real routes here.
  const v1 = Router();
  deps.extraRoutes?.(v1);
  app.use('/api/v1', v1);

  app.use((_req, res) => {
    const body: ApiErrorBody = { error: { code: 'NOT_FOUND', message: 'Route not found' } };
    res.status(404).json(body);
  });

  app.use(errorHandler);

  return app;
}
