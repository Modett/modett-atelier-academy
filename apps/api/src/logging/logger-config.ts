import type { Params } from 'nestjs-pino';
import { ensureRequestId } from '../common/request-id/request-id';
import type { AppConfigService } from '../config/app-config.service';

export function createLoggerOptions(config: AppConfigService): Params {
  const isDevelopment = config.nodeEnv === 'development';

  return {
    pinoHttp: {
      level: config.logLevel,
      genReqId: (req, res) => ensureRequestId(req, res),
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'password', '*.password'],
        remove: true,
      },
      transport: isDevelopment ? { target: 'pino-pretty', options: { singleLine: true } } : undefined,
    },
  };
}
