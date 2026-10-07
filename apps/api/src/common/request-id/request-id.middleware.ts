import { Injectable } from '@nestjs/common';
import type { NestMiddleware } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { ensureRequestId } from './request-id';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void): void {
    ensureRequestId(req, res);
    next();
  }
}
