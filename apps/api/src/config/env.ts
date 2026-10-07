import { z } from 'zod';

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  CORS_ORIGINS: z
    .string()
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)),
  SESSION_COOKIE_DOMAIN: z.string().optional(),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
});

export type AppConfig = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, unknown>): AppConfig {
  return envSchema.parse(source);
}

export function loadEnv(source: Record<string, unknown>): AppConfig {
  const result = envSchema.safeParse(source);
  if (result.success) {
    return result.data;
  }

  const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0] ?? 'unknown')))];
  process.stderr.write(`Invalid environment variables: ${names.join(', ')}\n`);
  for (const issue of result.error.issues) {
    process.stderr.write(`  - ${String(issue.path[0] ?? 'unknown')}: ${issue.message}\n`);
  }
  process.exit(1);
}
