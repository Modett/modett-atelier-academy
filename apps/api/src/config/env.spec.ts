import { ZodError } from 'zod';
import { parseEnv } from './env';

const PRODUCTION_SECRET = '0123456789abcdef';

function zodMessages(error: unknown): string[] {
  if (!(error instanceof ZodError)) {
    throw error;
  }
  return error.issues.map((issue) => issue.message);
}

const base = {
  NODE_ENV: 'test',
  PORT: '3000',
  DATABASE_URL: 'postgresql://modett:modett@localhost:5432/modett',
  REDIS_URL: 'redis://localhost:6379',
  CORS_ORIGINS: 'http://localhost:3000',
  LOG_LEVEL: 'info',
};

describe('parseEnv', () => {
  it('accepts a valid environment', () => {
    const config = parseEnv({ ...base });

    expect(config.NODE_ENV).toBe('test');
    expect(config.PORT).toBe(3000);
    expect(config.LOG_LEVEL).toBe('info');
  });

  it('defaults LOG_LEVEL to info and PORT to 3000', () => {
    const config = parseEnv({
      NODE_ENV: 'test',
      DATABASE_URL: base.DATABASE_URL,
      REDIS_URL: base.REDIS_URL,
      CORS_ORIGINS: base.CORS_ORIGINS,
    });

    expect(config.LOG_LEVEL).toBe('info');
    expect(config.PORT).toBe(3000);
    expect(config.SESSION_COOKIE_DOMAIN).toBeUndefined();
  });

  it('parses CORS_ORIGINS into a trimmed, non-empty list', () => {
    const config = parseEnv({ ...base, CORS_ORIGINS: 'https://a.com, https://b.com ,' });

    expect(config.CORS_ORIGINS).toEqual(['https://a.com', 'https://b.com']);
  });

  it('fails and names the missing variables', () => {
    expect.assertions(2);
    try {
      parseEnv({ NODE_ENV: 'test' });
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
      const names = (error as ZodError).issues.map((issue) => String(issue.path[0]));
      expect(names).toEqual(expect.arrayContaining(['DATABASE_URL', 'REDIS_URL', 'CORS_ORIGINS']));
    }
  });

  it('fails on an invalid NODE_ENV value', () => {
    expect.assertions(2);
    try {
      parseEnv({ ...base, NODE_ENV: 'staging' });
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
      const names = (error as ZodError).issues.map((issue) => String(issue.path[0]));
      expect(names).toContain('NODE_ENV');
    }
  });

  it('fails in production when CF_ORIGIN_SECRET is missing', () => {
    expect.assertions(1);
    try {
      parseEnv({ ...base, NODE_ENV: 'production' });
    } catch (error) {
      expect(zodMessages(error)).toContain('CF_ORIGIN_SECRET is required in production');
    }
  });

  it('fails in production when DEV_COUNTRY_OVERRIDE is set', () => {
    expect.assertions(1);
    try {
      parseEnv({
        ...base,
        NODE_ENV: 'production',
        CF_ORIGIN_SECRET: PRODUCTION_SECRET,
        DEV_COUNTRY_OVERRIDE: 'LK',
      });
    } catch (error) {
      expect(zodMessages(error)).toContain('DEV_COUNTRY_OVERRIDE must not be set in production');
    }
  });

  it('accepts development without a Cloudflare secret or country override', () => {
    const config = parseEnv({ ...base, NODE_ENV: 'development' });

    expect(config.CF_ORIGIN_SECRET).toBeUndefined();
    expect(config.DEV_COUNTRY_OVERRIDE).toBeUndefined();
    expect(config.CF_ORIGIN_SECRET_HEADER).toBe('x-cf-origin-secret');
  });

  it('fails in production when CF_ORIGIN_SECRET is shorter than 16 characters', () => {
    expect.assertions(1);
    try {
      parseEnv({ ...base, NODE_ENV: 'production', CF_ORIGIN_SECRET: 'too-short' });
    } catch (error) {
      expect(zodMessages(error)).toContain(
        'CF_ORIGIN_SECRET must be at least 16 characters in production',
      );
    }
  });

  it('accepts production with a long secret and no country override', () => {
    const config = parseEnv({
      ...base,
      NODE_ENV: 'production',
      CF_ORIGIN_SECRET: PRODUCTION_SECRET,
    });

    expect(config.CF_ORIGIN_SECRET).toBe(PRODUCTION_SECRET);
    expect(config.DEV_COUNTRY_OVERRIDE).toBeUndefined();
  });

  it('lowercases a valid CF_ORIGIN_SECRET_HEADER', () => {
    const config = parseEnv({ ...base, CF_ORIGIN_SECRET_HEADER: 'X-Custom-Origin-Secret' });

    expect(config.CF_ORIGIN_SECRET_HEADER).toBe('x-custom-origin-secret');
  });

  it('accepts the default CF_ORIGIN_SECRET_HEADER shape', () => {
    const config = parseEnv({ ...base, CF_ORIGIN_SECRET_HEADER: 'x-cf-origin-secret' });

    expect(config.CF_ORIGIN_SECRET_HEADER).toBe('x-cf-origin-secret');
  });

  it.each(['bad_header', 'has.dot', 'has space', 'UPPER_BAD', 'a'.repeat(65)])(
    'rejects invalid CF_ORIGIN_SECRET_HEADER %p',
    (header) => {
      expect.assertions(2);
      try {
        parseEnv({ ...base, CF_ORIGIN_SECRET_HEADER: header });
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        expect(zodMessages(error)).toContain(
          'CF_ORIGIN_SECRET_HEADER must be 1-64 characters of lowercase letters, digits, or hyphens',
        );
      }
    },
  );
});
