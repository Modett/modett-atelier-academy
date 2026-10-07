import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ApiError } from '../../common/errors/api-error';
import { REDIS } from '../../infra/redis/redis.constants';
import { HealthRepository } from './health.repository';

const CHECK_TIMEOUT_MS = 2000;

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('timeout'));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

@Injectable()
export class HealthService {
  constructor(
    private readonly repository: HealthRepository,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async check(): Promise<{ status: 'ok' }> {
    const [postgres, redis] = await Promise.allSettled([
      withTimeout(this.repository.ping(), CHECK_TIMEOUT_MS),
      withTimeout(this.redis.ping(), CHECK_TIMEOUT_MS),
    ]);

    const failed: string[] = [];
    if (postgres.status === 'rejected') {
      failed.push('postgres');
    }
    if (redis.status === 'rejected') {
      failed.push('redis');
    }

    if (failed.length > 0) {
      throw ApiError.serviceUnavailable('One or more dependencies are unavailable', { failed });
    }

    return { status: 'ok' };
  }
}
