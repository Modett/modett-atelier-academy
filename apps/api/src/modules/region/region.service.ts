import { Injectable } from '@nestjs/common';
import type { ResolvedRegion } from '@modett/shared';

@Injectable()
export class RegionService {
  getRegion(region: ResolvedRegion): ResolvedRegion {
    return region;
  }
}
