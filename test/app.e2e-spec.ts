import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Logger } from 'nestjs-pino';

describe('Application (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    const logger = app.get(Logger);
    app.useLogger(logger);

    app.setGlobalPrefix('api', {
      exclude: ['api/docs'],
    });

    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    app.useGlobalFilters(new HttpExceptionFilter(logger));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/health (GET) - returns 200 and correlated X-Request-Id', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('custom X-Request-Id is preserved in response headers', async () => {
    const customId = 'test-trace-id-12345';
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('X-Request-Id', customId)
      .expect(200);

    expect(res.headers['x-request-id']).toBe(customId);
  });

  it('returns structured 404 for non-existent route', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/non-existent-endpoint')
      .expect(404);

    expect(res.body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      path: '/api/v1/non-existent-endpoint',
    });

    const body = res.body as Record<string, unknown>;
    expect(body.timestamp).toBeDefined();
  });
});
