import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { REDIS } from '../src/infra/redis/redis.constants';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    app.enableShutdownHooks();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 and { status: "ok" } when Postgres and Redis are up', async () => {
    const response = await request(app.getHttpServer()).get('/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns the standard error body with NOT_FOUND for an unknown route', async () => {
    const response = await request(app.getHttpServer()).get('/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(typeof response.body.error.requestId).toBe('string');
  });

  it('returns an x-request-id header on every response', async () => {
    const response = await request(app.getHttpServer()).get('/v1/health');

    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('echoes a client-supplied x-request-id', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/health')
      .set('x-request-id', 'client-supplied-id');

    expect(response.headers['x-request-id']).toBe('client-supplied-id');
  });

  it('includes the same request id in the header and the error body', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/does-not-exist')
      .set('x-request-id', 'error-request-id');

    expect(response.headers['x-request-id']).toBe('error-request-id');
    expect(response.body.error.requestId).toBe('error-request-id');
  });
});

describe('Health (e2e) with Redis unavailable', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const failingRedis = {
      ping: (): Promise<string> => Promise.reject(new Error('redis unavailable')),
      quit: (): Promise<'OK'> => Promise.resolve('OK'),
    };

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(REDIS)
      .useValue(failingRedis)
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    app.enableShutdownHooks();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 503 with the standard error body naming the failed dependency', async () => {
    const response = await request(app.getHttpServer()).get('/v1/health');

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(response.body.error.details).toEqual({ failed: ['redis'] });
    expect(typeof response.body.error.requestId).toBe('string');
  });
});
