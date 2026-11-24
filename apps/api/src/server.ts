import { createApp } from './app.js';
import { connectDb, disconnectDb } from './db/connect.js';
import { missingIndexes } from './db/index-check.js';
import { loadDotEnvFile, loadEnv } from './config/env.js';
import { createLogger } from './lib/logger.js';

loadDotEnvFile();
const env = loadEnv();
const logger = createLogger(env);
const app = createApp({ env, logger });

await connectDb(env.MONGODB_URI, { dnsServers: env.DNS_SERVERS });
logger.info('MongoDB connected');

try {
  const missing = await missingIndexes();
  if (missing.length > 0) {
    const list = missing.map((m) => `${m.model}(${m.index})`).join(', ');
    logger.warn(
      `Missing indexes: ${list}. Run \`npm run migrate -w @itsadate/api\` to build them.`,
    );
  }
} catch {
  logger.warn('Could not check indexes');
}

const server = app.listen(env.PORT, () => {
  logger.info(`API listening on port ${env.PORT}`);
});

function shutdown(signal: string): void {
  logger.info(`${signal} received, shutting down`);
  const timer = setTimeout(() => process.exit(1), 10_000);
  timer.unref();
  server.close(() => {
    disconnectDb().then(
      () => process.exit(0),
      () => process.exit(1),
    );
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
