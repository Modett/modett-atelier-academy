import { Controller, Get, Header } from '@nestjs/common';
import type { ResolvedRegion } from '@modett/shared';
import { CurrentRegion } from '../../common/decorators/current-region.decorator';
import { RegionService } from './region.service';

@Controller('region')
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  getRegion(@CurrentRegion() region: ResolvedRegion): ResolvedRegion {
    return this.regionService.getRegion(region);
  }
}
