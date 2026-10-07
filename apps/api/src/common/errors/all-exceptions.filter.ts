import { Catch, HttpException } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import type { ServerResponse } from 'node:http';
import { PinoLogger } from 'nestjs-pino';
import { ApiError } from './api-error';
import { ErrorCode } from './error-codes';
import { getRequestId } from '../request-id/request-id';
import type { RequestWithId } from '../request-id/request-id';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithId>();
    const response = ctx.getResponse<ServerResponse>();
    const requestId = getRequestId(request);

    const apiError = this.toApiError(exception, requestId);

    const body = {
      error: {
        code: apiError.code,
        message: apiError.message,
        ...(apiError.details !== undefined ? { details: apiError.details } : {}),
        requestId,
      },
    };

    httpAdapter.reply(response, body, apiError.status);
  }

  private toApiError(exception: unknown, requestId: string): ApiError {
    if (exception instanceof ApiError) {
      return exception;
    }
    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError();
      if (zodError instanceof ZodError) {
        return this.fromZodError(zodError);
      }
      return new ApiError(422, ErrorCode.VALIDATION_FAILED, 'Validation failed');
    }
    if (exception instanceof ZodError) {
      return this.fromZodError(exception);
    }
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }

    this.logger.error({ err: exception, requestId }, 'Unhandled exception');
    return ApiError.internal();
  }

  private fromZodError(error: ZodError): ApiError {
    const details = error.issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    }));
    return new ApiError(422, ErrorCode.VALIDATION_FAILED, 'Validation failed', details);
  }

  private fromHttpException(exception: HttpException): ApiError {
    const status = exception.getStatus();
    switch (status) {
      case 400:
        return ApiError.badRequest();
      case 401:
        return ApiError.unauthorized();
      case 403:
        return ApiError.forbidden();
      case 404:
        return ApiError.notFound();
      case 409:
        return ApiError.conflict();
      case 422:
        return ApiError.unprocessable();
      case 429:
        return ApiError.tooManyRequests();
      case 503:
        return ApiError.serviceUnavailable();
      default:
        return status >= 500 ? ApiError.internal() : ApiError.badRequest();
    }
  }
}
