import { Pool } from 'pg';
import { createDb } from './index';

describe('createDb', () => {
  it('returns a drizzle instance and a pg pool', async () => {
    const { db, pool } = createDb('postgresql://modett:modett@localhost:5432/modett');

    expect(db).toBeDefined();
    expect(pool).toBeInstanceOf(Pool);

    await pool.end();
  });

  it('forwards pool options without overriding the connection string', async () => {
    const { pool } = createDb('postgresql://modett:modett@localhost:5432/modett', {
      max: 3,
    });

    expect(pool.options.max).toBe(3);

    await pool.end();
  });
});
