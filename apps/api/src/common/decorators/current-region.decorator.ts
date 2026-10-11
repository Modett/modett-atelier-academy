import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { IncomingMessage } from 'node:http';
import type { ResolvedRegion } from '@modett/shared';
import { readRequestRegion } from '../../modules/region/region.middleware';

export const CurrentRegion = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ResolvedRegion => {
    const request = ctx.switchToHttp().getRequest<IncomingMessage>();
    return readRequestRegion(request);
  },
);
