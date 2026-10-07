import { ZodError } from 'zod';
import { parseEnv } from './env';

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
});
