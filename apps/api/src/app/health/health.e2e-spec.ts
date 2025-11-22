import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { HealthModule } from './health.module';
import { CalibreDb1Service } from '../database/calibre-db1.service';
import { CacheService, CacheKey } from '../cache/cache.service';

class CalibreDb1ServiceMockHealthy {
  getDbDate = jest.fn().mockResolvedValue(new Date());
}

class CacheServiceMockHealthy {
  getCacheNumber = jest.fn().mockResolvedValue(123);
  getCacheDate = jest.fn().mockResolvedValue(new Date());
}

class CalibreDb1ServiceMockUnhealthy {
  getDbDate = jest.fn().mockRejectedValue(new Error('db not accessible'));
}

class CacheServiceMockUnhealthy {
  getCacheNumber = jest.fn().mockRejectedValue(new Error('no count cache'));
  getCacheDate = jest.fn().mockRejectedValue(new Error('no cache'));
}

describe('Health endpoints (e2e)', () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('HEAD /api/health returns 200 when components are present', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
    })
      .overrideProvider(CalibreDb1Service)
      .useClass(CalibreDb1ServiceMockHealthy)
      .overrideProvider(CacheService)
      .useClass(CacheServiceMockHealthy)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).head('/api/health').expect(200);
  });

  it('HEAD /api/health returns 503 when a component is missing', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
    })
      .overrideProvider(CalibreDb1Service)
      .useClass(CalibreDb1ServiceMockUnhealthy)
      .overrideProvider(CacheService)
      .useClass(CacheServiceMockUnhealthy)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).head('/api/health').expect(503);
  });

  it('GET /api/health/deep returns 200 with a status payload when healthy', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
    })
      .overrideProvider(CalibreDb1Service)
      .useClass(CalibreDb1ServiceMockHealthy)
      .overrideProvider(CacheService)
      .useClass(CacheServiceMockHealthy)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer()).get('/api/health/deep').expect(200).expect('Content-Type', /json/);
    expect(res.body).toBeDefined();
    expect(res.body.status).toBeDefined();
  });

  it('HEAD /api/health/deep returns 503 when unhealthy', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
    })
      .overrideProvider(CalibreDb1Service)
      .useClass(CalibreDb1ServiceMockUnhealthy)
      .overrideProvider(CacheService)
      .useClass(CacheServiceMockUnhealthy)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).head('/api/health/deep').expect(503);
  });
});
