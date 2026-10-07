import { Global, Inject, Module } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { createDb } from '@modett/db';
import type { CreateDbResult } from '@modett/db';
import { AppConfigService } from '../../config/app-config.service';
import { DATABASE, DATABASE_CONNECTION } from './database.constants';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): CreateDbResult => createDb(config.databaseUrl),
    },
    {
      provide: DATABASE,
      inject: [DATABASE_CONNECTION],
      useFactory: (connection: CreateDbResult) => connection.db,
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_CONNECTION) private readonly connection: CreateDbResult) {}

  async onApplicationShutdown(): Promise<void> {
    await this.connection.pool.end();
  }
}
