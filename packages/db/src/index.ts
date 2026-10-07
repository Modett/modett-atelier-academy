import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { PoolConfig } from 'pg';

export type Database = NodePgDatabase;

export interface CreateDbResult {
  db: Database;
  pool: Pool;
}

export function createDb(connectionString: string, options?: PoolConfig): CreateDbResult {
  const pool = new Pool({ ...options, connectionString });
  const db = drizzle(pool);
  return { db, pool };
}
