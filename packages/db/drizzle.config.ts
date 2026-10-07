import { defineConfig } from 'drizzle-kit';

// Placeholder configuration: no schema or tables are defined yet.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://modett:modett@localhost:5432/modett',
  },
});
