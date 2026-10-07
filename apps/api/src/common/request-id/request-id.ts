import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export const REQUEST_ID_HEADER = 'x-request-id';

const VALID_REQUEST_ID = /^[A-Za-z0-9._-]{1,128}$/;

export type RequestWithId = IncomingMessage & { id?: unknown };

export function isValidRequestId(value: unknown): value is string {
  return typeof value === 'string' && VALID_REQUEST_ID.test(value);
}

export function ensureRequestId(req: RequestWithId, res: ServerResponse): string {
  const current = req.id;
  if (typeof current === 'string' && current.length > 0) {
    res.setHeader(REQUEST_ID_HEADER, current);
    return current;
  }

  const header = req.headers[REQUEST_ID_HEADER];
  const candidate = Array.isArray(header) ? header[0] : header;
  const id = isValidRequestId(candidate) ? candidate : randomUUID();

  req.id = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  return id;
}

export function getRequestId(req: RequestWithId): string {
  return typeof req.id === 'string' && req.id.length > 0 ? req.id : 'unknown';
}
