import { NotFoundException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';
import { z } from 'zod';
import type { PinoLogger } from 'nestjs-pino';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ApiError } from './api-error';
import { ErrorCode } from './error-codes';

interface ReplyCall {
  body: {
    error: { code: string; message: string; details?: unknown; requestId: string };
  };
  status: number;
}

function setup(): {
  filter: AllExceptionsFilter;
  reply: jest.Mock;
  error: jest.Mock;
  host: ArgumentsHost;
  lastReply: () => ReplyCall;
} {
  const reply = jest.fn();
  const error = jest.fn();
  const adapterHost = { httpAdapter: { reply } };
  const logger = { setContext: jest.fn(), error };
  // Test-only cast: inject lightweight stubs in place of the Nest providers.
  const filter = new AllExceptionsFilter(
    adapterHost as unknown as HttpAdapterHost,
    logger as unknown as PinoLogger,
  );

  const request = { id: 'req-1', headers: {} };
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
    }),
  } as unknown as ArgumentsHost;

  const lastReply = (): ReplyCall => {
    const call = reply.mock.calls.at(-1) ?? [];
    return { body: call[1] as ReplyCall['body'], status: call[2] as number };
  };

  return { filter, reply, error, host, lastReply };
}

describe('AllExceptionsFilter', () => {
  it('passes an ApiError through unchanged', () => {
    const { filter, host, lastReply } = setup();

    filter.catch(ApiError.conflict('duplicate', { field: 'email' }), host);

    const { body, status } = lastReply();
    expect(status).toBe(409);
    expect(body.error.code).toBe(ErrorCode.CONFLICT);
    expect(body.error.message).toBe('duplicate');
    expect(body.error.details).toEqual({ field: 'email' });
    expect(body.error.requestId).toBe('req-1');
  });

  it('converts a Zod error to a 422 VALIDATION_FAILED', () => {
    const { filter, host, lastReply } = setup();
    const parsed = z.object({ name: z.string() }).safeParse({});

    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }

    filter.catch(parsed.error, host);

    const { body, status } = lastReply();
    expect(status).toBe(422);
    expect(body.error.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(body.error.details).toEqual([{ path: 'name', message: expect.any(String) }]);
  });

  it('converts a Nest HttpException to the matching ApiError', () => {
    const { filter, host, lastReply } = setup();

    filter.catch(new NotFoundException(), host);

    const { body, status } = lastReply();
    expect(status).toBe(404);
    expect(body.error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it('hides unknown errors behind a generic internal error and logs the real one', () => {
    const { filter, host, lastReply, error } = setup();

    filter.catch(new Error('secret database detail'), host);

    const { body, status } = lastReply();
    expect(status).toBe(500);
    expect(body.error.code).toBe(ErrorCode.INTERNAL);
    expect(body.error.message).not.toContain('secret');
    expect(error).toHaveBeenCalledTimes(1);
  });
});
