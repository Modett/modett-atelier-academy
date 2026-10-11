import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response } from 'supertest';
import { AppModule } from '../../app.module';

const SECRET = '0123456789abcdef';

const REGION_ENV_KEYS = [
  'CF_ORIGIN_SECRET',
  'CF_ORIGIN_SECRET_HEADER',
  'DEV_COUNTRY_OVERRIDE',
] as const;

type RegionEnvKey = (typeof REGION_ENV_KEYS)[number];
type SavedRegionEnv = Partial<Record<RegionEnvKey, string | undefined>>;

function captureRegionEnv(): SavedRegionEnv {
  const saved: SavedRegionEnv = {};
  for (const key of REGION_ENV_KEYS) {
    saved[key] = process.env[key];
  }
  return saved;
}

function restoreRegionEnv(saved: SavedRegionEnv): void {
  for (const key of REGION_ENV_KEYS) {
    const value = saved[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('v1');
  app.enableShutdownHooks();
  await app.init();
  return app;
}

async function getRegion(
  app: INestApplication,
  headers: Record<string, string> = {},
): Promise<Response> {
  const pending = request(app.getHttpServer()).get('/v1/region');
  for (const [name, value] of Object.entries(headers)) {
    pending.set(name, value);
  }
  return pending;
}

describe('Region (e2e)', () => {
  let app: INestApplication;
  let savedEnv: SavedRegionEnv;

  beforeAll(async () => {
    savedEnv = captureRegionEnv();
    delete process.env.CF_ORIGIN_SECRET;
    delete process.env.DEV_COUNTRY_OVERRIDE;
    app = await createApp();
  });

  afterAll(async () => {
    restoreRegionEnv(savedEnv);
    await app.close();
  });

  it.each([
    ['LK', { country: 'LK', region: 'LK', currency: 'LKR' }],
    ['SG', { country: 'SG', region: 'SG', currency: 'SGD' }],
    ['DE', { country: 'DE', region: 'EU', currency: 'EUR' }],
    ['GB', { country: 'GB', region: 'EU', currency: 'EUR' }],
    ['US', { country: 'US', region: 'ROW', currency: 'USD' }],
    ['XX', { country: null, region: 'ROW', currency: 'USD' }],
  ] as const)('GET /v1/region with cf-ipcountry %s', async (country, expected) => {
    const response = await getRegion(app, { 'cf-ipcountry': country });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expected);
    expect(response.headers['cache-control']).toBe('private, no-store');
  });

  it('returns ROW and USD when cf-ipcountry is absent', async () => {
    const response = await getRegion(app);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ country: null, region: 'ROW', currency: 'USD' });
    expect(response.headers['cache-control']).toBe('private, no-store');
  });

  it('returns the standard NOT_FOUND error body for an unknown route', async () => {
    const response = await request(app.getHttpServer()).get('/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.message).toBe('Not found');
    expect(typeof response.body.error.requestId).toBe('string');
    expect(response.body.error.details).toBeUndefined();
  });
});

describe('Region (e2e) with an origin secret', () => {
  let app: INestApplication;
  let savedEnv: SavedRegionEnv;

  beforeAll(async () => {
    savedEnv = captureRegionEnv();
    process.env.CF_ORIGIN_SECRET = SECRET;
    delete process.env.DEV_COUNTRY_OVERRIDE;
    app = await createApp();
  });

  afterAll(async () => {
    restoreRegionEnv(savedEnv);
    await app.close();
  });

  it('uses cf-ipcountry when the secret header matches', async () => {
    const response = await getRegion(app, {
      'cf-ipcountry': 'LK',
      'x-cf-origin-secret': SECRET,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ country: 'LK', region: 'LK', currency: 'LKR' });
  });

  it('ignores cf-ipcountry when the secret header is wrong', async () => {
    const response = await getRegion(app, {
      'cf-ipcountry': 'LK',
      'x-cf-origin-secret': 'not-the-secret',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ country: null, region: 'ROW', currency: 'USD' });
  });

  it('ignores cf-ipcountry when the secret header is missing', async () => {
    const response = await getRegion(app, { 'cf-ipcountry': 'LK' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ country: null, region: 'ROW', currency: 'USD' });
  });
});
