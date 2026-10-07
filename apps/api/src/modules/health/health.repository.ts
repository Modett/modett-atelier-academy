import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { Database } from '@modett/db';
import { DATABASE } from '../../infra/database/database.constants';

@Injectable()
export class HealthRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async ping(): Promise<void> {
    await this.db.execute(sql`SELECT 1`);
  }
}
