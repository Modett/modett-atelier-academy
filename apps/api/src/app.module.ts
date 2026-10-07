import { Module } from '@nestjs/common';
import type { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';
import { AllExceptionsFilter } from './common/errors/all-exceptions.filter';
import { RequestIdMiddleware } from './common/request-id/request-id.middleware';
import { AppConfigService } from './config/app-config.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './infra/database/database.module';
import { RedisModule } from './infra/redis/redis.module';
import { createLoggerOptions } from './logging/logger-config';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => createLoggerOptions(config),
    }),
    DatabaseModule,
    RedisModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('{*path}');
  }
}
