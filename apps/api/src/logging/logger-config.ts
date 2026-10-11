import type { Params } from 'nestjs-pino';
import { ensureRequestId } from '../common/request-id/request-id';
import type { AppConfig } from '../config/env';
import { DEFAULT_CF_ORIGIN_SECRET_HEADER } from '../config/env';

export type LoggerConfigInput = {
  nodeEnv: AppConfig['NODE_ENV'];
  logLevel: AppConfig['LOG_LEVEL'];
  cfOriginSecretHeader: string;
};

export function buildRedactPaths(originSecretHeader: string): string[] {
  const configuredHeader = originSecretHeader.toLowerCase();
  const secretHeaders = new Set([DEFAULT_CF_ORIGIN_SECRET_HEADER, configuredHeader]);

  return [
    'req.headers.authorization',
    'req.headers.cookie',
    ...[...secretHeaders].map((header) => `req.headers.${header}`),
    'password',
    '*.password',
  ];
}

export function createLoggerOptions(config: LoggerConfigInput): Params {
  const isDevelopment = config.nodeEnv === 'development';

  return {
    pinoHttp: {
      level: config.logLevel,
      genReqId: (req, res) => ensureRequestId(req, res),
      redact: {
        paths: buildRedactPaths(config.cfOriginSecretHeader),
      },
      transport: isDevelopment ? { target: 'pino-pretty', options: { singleLine: true } } : undefined,
    },
  };
}
