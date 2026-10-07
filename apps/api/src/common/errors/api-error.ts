import { ErrorCode } from './error-codes';
import type { ErrorCodeValue } from './error-codes';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCodeValue;
  readonly details?: unknown;

  constructor(status: number, code: ErrorCodeValue, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Bad request', details?: unknown): ApiError {
    return new ApiError(400, ErrorCode.BAD_REQUEST, message, details);
  }

  static unauthorized(message = 'Unauthorized', details?: unknown): ApiError {
    return new ApiError(401, ErrorCode.UNAUTHORIZED, message, details);
  }

  static forbidden(message = 'Forbidden', details?: unknown): ApiError {
    return new ApiError(403, ErrorCode.FORBIDDEN, message, details);
  }

  static notFound(message = 'Not found', details?: unknown): ApiError {
    return new ApiError(404, ErrorCode.NOT_FOUND, message, details);
  }

  static conflict(message = 'Conflict', details?: unknown): ApiError {
    return new ApiError(409, ErrorCode.CONFLICT, message, details);
  }

  static unprocessable(message = 'Unprocessable entity', details?: unknown): ApiError {
    return new ApiError(422, ErrorCode.UNPROCESSABLE, message, details);
  }

  static tooManyRequests(message = 'Too many requests', details?: unknown): ApiError {
    return new ApiError(429, ErrorCode.RATE_LIMITED, message, details);
  }

  static serviceUnavailable(message = 'Service unavailable', details?: unknown): ApiError {
    return new ApiError(503, ErrorCode.SERVICE_UNAVAILABLE, message, details);
  }

  static internal(message = 'Internal server error', details?: unknown): ApiError {
    return new ApiError(500, ErrorCode.INTERNAL, message, details);
  }
}
