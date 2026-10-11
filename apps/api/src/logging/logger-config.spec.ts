import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Writable } from 'node:stream';
import pino from 'pino';
import { pinoHttp } from 'pino-http';
import type { HttpLogger } from 'pino-http';
import request from 'supertest';
import { DEFAULT_CF_ORIGIN_SECRET_HEADER } from '../config/env';
import { buildRedactPaths, createLoggerOptions } from './logger-config';
import type { LoggerConfigInput } from './logger-config';

const ORIGIN_SECRET_VALUE = 'origin-secret-should-never-appear';
const AUTHORIZATION_VALUE = 'Bearer authorization-should-never-appear';
const COOKIE_VALUE = 'session=cookie-should-never-appear';
const PASSWORD_VALUE = 'password-should-never-appear';
const CUSTOM_ORIGIN_HEADER = 'x-custom-origin-secret';

function loggerConfig(overrides: Partial<LoggerConfigInput> = {}): LoggerConfigInput {
  return {
    nodeEnv: 'test',
    logLevel: 'info',
    cfOriginSecretHeader: DEFAULT_CF_ORIGIN_SECRET_HEADER,
    ...overrides,
  };
}

function createCaptureStream(): { stream: Writable; read: () => string } {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk: string | Buffer, _encoding, callback): void {
      chunks.push(typeof chunk === 'string' ? chunk : chunk.toString('utf8'));
      callback();
    },
  });

  return {
    stream,
    read: (): string => chunks.join(''),
  };
}

async function flushLogger(logger: pino.Logger): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    logger.flush((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function withRequestLogCapture(
  configuredHeader: string,
  handle: (args: {
    middleware: HttpLogger<IncomingMessage, ServerResponse>;
    logger: pino.Logger;
    req: IncomingMessage;
    res: ServerResponse;
  }) => void,
  headers: Record<string, string>,
): Promise<string> {
  const capture = createCaptureStream();
  const logger = pino(
    {
      level: 'info',
      redact: {
        paths: buildRedactPaths(configuredHeader),
      },
    },
    capture.stream,
  );
  const middleware = pinoHttp({ logger });
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    handle({ middleware, logger, req, res });
  });

  try {
    const pending = request(server).get('/v1/region');
    for (const [name, value] of Object.entries(headers)) {
      pending.set(name, value);
    }
    await pending.expect(200);
    await flushLogger(logger);
    return capture.read();
  } finally {
    if (server.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  }
}

async function captureRequestLog(options: {
  configuredHeader: string;
  requestHeader: string;
  secretValue: string;
  extraHeaders?: Record<string, string>;
}): Promise<string> {
  return withRequestLogCapture(
    options.configuredHeader,
    ({ middleware, req, res }) => {
      middleware(req, res);
      res.statusCode = 200;
      res.end('ok');
    },
    {
      [options.requestHeader]: options.secretValue,
      ...options.extraHeaders,
    },
  );
}

describe('buildRedactPaths', () => {
  it('always includes the default origin secret header', () => {
    const paths = buildRedactPaths(DEFAULT_CF_ORIGIN_SECRET_HEADER);

    expect(paths).toEqual(
      expect.arrayContaining([
        'req.headers.authorization',
        'req.headers.cookie',
        `req.headers.${DEFAULT_CF_ORIGIN_SECRET_HEADER}`,
        'password',
        '*.password',
      ]),
    );
  });

  it('includes a custom configured header in lowercase', () => {
    const paths = buildRedactPaths('X-Custom-Origin-Secret');

    expect(paths).toEqual(
      expect.arrayContaining([
        `req.headers.${DEFAULT_CF_ORIGIN_SECRET_HEADER}`,
        'req.headers.x-custom-origin-secret',
      ]),
    );
  });
});

describe('createLoggerOptions', () => {
  it('uses redact paths built from the configured origin secret header', () => {
    const options = createLoggerOptions(loggerConfig({ cfOriginSecretHeader: CUSTOM_ORIGIN_HEADER }));
    const pinoHttpOptions = options.pinoHttp;

    expect(pinoHttpOptions).toEqual(
      expect.objectContaining({
        redact: {
          paths: buildRedactPaths(CUSTOM_ORIGIN_HEADER),
        },
      }),
    );
  });
});

describe('request log redaction', () => {
  it('redacts the default origin secret header on a request', async () => {
    const output = await captureRequestLog({
      configuredHeader: DEFAULT_CF_ORIGIN_SECRET_HEADER,
      requestHeader: DEFAULT_CF_ORIGIN_SECRET_HEADER,
      secretValue: ORIGIN_SECRET_VALUE,
    });

    expect(output).not.toContain(ORIGIN_SECRET_VALUE);
    expect(output).toContain('[Redacted]');
  });

  it('redacts a custom configured origin secret header on a request', async () => {
    const output = await captureRequestLog({
      configuredHeader: CUSTOM_ORIGIN_HEADER,
      requestHeader: CUSTOM_ORIGIN_HEADER,
      secretValue: ORIGIN_SECRET_VALUE,
    });

    expect(output).not.toContain(ORIGIN_SECRET_VALUE);
    expect(output).toContain('[Redacted]');
  });

  it('still redacts authorization, cookie, and password fields', async () => {
    const output = await withRequestLogCapture(
      DEFAULT_CF_ORIGIN_SECRET_HEADER,
      ({ middleware, logger, req, res }) => {
        middleware(req, res);
        logger.info({ password: PASSWORD_VALUE, user: { password: PASSWORD_VALUE } }, 'sensitive');
        res.statusCode = 200;
        res.end('ok');
      },
      {
        authorization: AUTHORIZATION_VALUE,
        cookie: COOKIE_VALUE,
        [DEFAULT_CF_ORIGIN_SECRET_HEADER]: ORIGIN_SECRET_VALUE,
      },
    );

    expect(output).not.toContain(AUTHORIZATION_VALUE);
    expect(output).not.toContain(COOKIE_VALUE);
    expect(output).not.toContain(PASSWORD_VALUE);
    expect(output).not.toContain(ORIGIN_SECRET_VALUE);
    expect(output).toContain('[Redacted]');
  });
});
