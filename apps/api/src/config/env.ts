import { z } from 'zod';

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

const MIN_PRODUCTION_SECRET_LENGTH = 16;
export const DEFAULT_CF_ORIGIN_SECRET_HEADER = 'x-cf-origin-secret';
const COUNTRY_CODE = /^[A-Za-z]{2}$/;
const ORIGIN_SECRET_HEADER = /^[a-z0-9-]{1,64}$/;

function undefinedIfEmpty(value: unknown): unknown {
  return value === '' ? undefined : value;
}

function lowercaseOriginSecretHeader(value: unknown): unknown {
  const cleaned = undefinedIfEmpty(value);
  if (typeof cleaned === 'string') {
    return cleaned.toLowerCase();
  }
  return cleaned;
}

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.url(),
    REDIS_URL: z.url(),
    CORS_ORIGINS: z.string().transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
    SESSION_COOKIE_DOMAIN: z.string().optional(),
    LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
    CF_ORIGIN_SECRET: z.preprocess(undefinedIfEmpty, z.string().optional()),
    CF_ORIGIN_SECRET_HEADER: z.preprocess(
      lowercaseOriginSecretHeader,
      z
        .string()
        .regex(
          ORIGIN_SECRET_HEADER,
          'CF_ORIGIN_SECRET_HEADER must be 1-64 characters of lowercase letters, digits, or hyphens',
        )
        .default(DEFAULT_CF_ORIGIN_SECRET_HEADER),
    ),
    DEV_COUNTRY_OVERRIDE: z.preprocess(
      undefinedIfEmpty,
      z
        .string()
        .regex(COUNTRY_CODE, 'DEV_COUNTRY_OVERRIDE must be a two-letter ISO country code')
        .optional(),
    ),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') {
      return;
    }

    if (env.CF_ORIGIN_SECRET === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['CF_ORIGIN_SECRET'],
        message: 'CF_ORIGIN_SECRET is required in production',
      });
    } else if (env.CF_ORIGIN_SECRET.length < MIN_PRODUCTION_SECRET_LENGTH) {
      ctx.addIssue({
        code: 'custom',
        path: ['CF_ORIGIN_SECRET'],
        message: 'CF_ORIGIN_SECRET must be at least 16 characters in production',
      });
    }

    if (env.DEV_COUNTRY_OVERRIDE !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['DEV_COUNTRY_OVERRIDE'],
        message: 'DEV_COUNTRY_OVERRIDE must not be set in production',
      });
    }
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

  const names = [
    ...new Set(result.error.issues.map((issue) => String(issue.path[0] ?? 'unknown'))),
  ];
  process.stderr.write(`Invalid environment variables: ${names.join(', ')}\n`);
  for (const issue of result.error.issues) {
    process.stderr.write(`  - ${String(issue.path[0] ?? 'unknown')}: ${issue.message}\n`);
  }
  process.exit(1);
}
