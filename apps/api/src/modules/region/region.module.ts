import { Module } from '@nestjs/common';
import type { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { RegionController } from './region.controller';
import { RegionMiddleware } from './region.middleware';
import { RegionService } from './region.service';

@Module({
  controllers: [RegionController],
  providers: [RegionService],
})
export class RegionModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RegionMiddleware).forRoutes('{*path}');
  }
}
