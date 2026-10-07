import pino from 'pino';
import type { Logger } from 'pino';

export function createLogger(): Logger {
  return pino();
}

export function registerShutdown(logger: Logger): void {
  const shutdown = (signal: NodeJS.Signals): void => {
    logger.info({ signal }, 'worker shutting down');
    process.exit(0);
  };

  process.once('SIGINT', () => {
    shutdown('SIGINT');
  });
  process.once('SIGTERM', () => {
    shutdown('SIGTERM');
  });
}

export function start(logger: Logger = createLogger()): void {
  logger.info('worker started');
  registerShutdown(logger);
}

if (require.main === module) {
  start();
}
