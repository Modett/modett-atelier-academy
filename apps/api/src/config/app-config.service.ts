import { Injectable } from '@nestjs/common';
import { loadEnv } from './env';
import type { AppConfig } from './env';

@Injectable()
export class AppConfigService {
  private readonly config: AppConfig;

  constructor() {
    this.config = loadEnv(process.env);
  }

  get nodeEnv(): AppConfig['NODE_ENV'] {
    return this.config.NODE_ENV;
  }

  get port(): number {
    return this.config.PORT;
  }

  get databaseUrl(): string {
    return this.config.DATABASE_URL;
  }

  get redisUrl(): string {
    return this.config.REDIS_URL;
  }

  get corsOrigins(): string[] {
    return this.config.CORS_ORIGINS;
  }

  get sessionCookieDomain(): string | undefined {
    return this.config.SESSION_COOKIE_DOMAIN;
  }

  get logLevel(): AppConfig['LOG_LEVEL'] {
    return this.config.LOG_LEVEL;
  }

  get cfOriginSecret(): string | undefined {
    return this.config.CF_ORIGIN_SECRET;
  }

  get cfOriginSecretHeader(): string {
    return this.config.CF_ORIGIN_SECRET_HEADER;
  }

  get devCountryOverride(): string | undefined {
    return this.config.DEV_COUNTRY_OVERRIDE;
  }
}
