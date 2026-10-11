import { Injectable } from '@nestjs/common';
import type { NestMiddleware } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ResolvedRegion } from '@modett/shared';
import { ApiError } from '../../common/errors/api-error';
import { AppConfigService } from '../../config/app-config.service';
import { resolveRequestRegion } from './region.resolver';

declare module 'node:http' {
  interface IncomingMessage {
    region?: ResolvedRegion;
  }
}

export function readRequestRegion(req: IncomingMessage): ResolvedRegion {
  const region = req.region;
  if (region === undefined) {
    throw ApiError.internal('Region is not available for this request');
  }
  return region;
}

@Injectable()
export class RegionMiddleware implements NestMiddleware {
  constructor(private readonly config: AppConfigService) {}

  use(req: IncomingMessage, _res: ServerResponse, next: (error?: unknown) => void): void {
    req.region = resolveRequestRegion(req.headers, {
      devCountryOverride: this.config.devCountryOverride,
      originSecret: this.config.cfOriginSecret,
      originSecretHeader: this.config.cfOriginSecretHeader,
    });
    next();
  }
}
