import { createApp } from './app.js';
import { loadDotEnvFile, loadEnv } from './config/env.js';
import { createLogger } from './lib/logger.js';

loadDotEnvFile();
const env = loadEnv();
const logger = createLogger(env);
const app = createApp({ env, logger });

const server = app.listen(env.PORT, () => {
  logger.info(`API listening on port ${env.PORT}`);
});

function shutdown(signal: string): void {
  logger.info(`${signal} received, shutting down`);
  const timer = setTimeout(() => process.exit(1), 10_000);
  timer.unref();
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
