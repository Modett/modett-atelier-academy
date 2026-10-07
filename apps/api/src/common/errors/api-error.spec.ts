import { ApiError } from './api-error';
import { ErrorCode } from './error-codes';

describe('ApiError factories', () => {
  const cases = [
    { factory: ApiError.badRequest, status: 400, code: ErrorCode.BAD_REQUEST },
    { factory: ApiError.unauthorized, status: 401, code: ErrorCode.UNAUTHORIZED },
    { factory: ApiError.forbidden, status: 403, code: ErrorCode.FORBIDDEN },
    { factory: ApiError.notFound, status: 404, code: ErrorCode.NOT_FOUND },
    { factory: ApiError.conflict, status: 409, code: ErrorCode.CONFLICT },
    { factory: ApiError.unprocessable, status: 422, code: ErrorCode.UNPROCESSABLE },
    { factory: ApiError.tooManyRequests, status: 429, code: ErrorCode.RATE_LIMITED },
    { factory: ApiError.serviceUnavailable, status: 503, code: ErrorCode.SERVICE_UNAVAILABLE },
    { factory: ApiError.internal, status: 500, code: ErrorCode.INTERNAL },
  ] as const;

  it.each(cases)('$code maps to status $status', ({ factory, status, code }) => {
    const error = factory();

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(status);
    expect(error.code).toBe(code);
    expect(typeof error.message).toBe('string');
  });

  it('carries an optional message and details', () => {
    const error = ApiError.conflict('duplicate', { field: 'email' });

    expect(error.message).toBe('duplicate');
    expect(error.details).toEqual({ field: 'email' });
  });
});
