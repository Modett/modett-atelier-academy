import { Global, Inject, Module } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppConfigService } from '../../config/app-config.service';
import { REDIS } from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): Redis =>
        new Redis(config.redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => Math.min(times * 200, 2000),
        }),
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.redis.quit();
  }
}
