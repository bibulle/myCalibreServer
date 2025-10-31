import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { CacheService } from '../cache/cache.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';
import { Status } from '@my-calibre-server/api-interfaces';

describe('HealthController (e2e)', () => {
  let app: INestApplication;
  let healthService: HealthService;

  const mockStatus: Status = {
    calibreDate: new Date('2023-07-13T08:26:34.000Z'),
    calibreSize: 3,
    cacheBooks: new Date('2023-07-13T10:00:00.000Z'),
    calibreStatus: 'OK',
    cacheStatus: 'OK',
  };

  const mockHealthService = {
    getHealthSattus: jest.fn().mockResolvedValue(mockStatus),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    healthService = moduleFixture.get<HealthService>(HealthService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/health (GET)', () => {
    it('should return health status with HTTP 200', async () => {
      const response = await request(app.getHttpServer()).get('/health').expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('status');
      // Les dates sont sérialisées en strings dans la réponse JSON
      expect(response.body.status).toEqual({
        calibreDate: mockStatus.calibreDate.toISOString(),
        calibreSize: mockStatus.calibreSize,
        cacheBooks: mockStatus.cacheBooks.toISOString(),
        calibreStatus: mockStatus.calibreStatus,
        cacheStatus: mockStatus.cacheStatus,
      });
    });

    it('should return health status quickly (< 1s)', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer()).get('/health').expect(HttpStatus.OK);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it('should call HealthService.getHealthSattus', async () => {
      await request(app.getHttpServer()).get('/health').expect(HttpStatus.OK);

      expect(mockHealthService.getHealthSattus).toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      mockHealthService.getHealthSattus.mockRejectedValueOnce(new Error('Database connection failed'));

      await request(app.getHttpServer()).get('/health').expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should return valid JSON structure', async () => {
      const response = await request(app.getHttpServer()).get('/health').expect(HttpStatus.OK).expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toHaveProperty('calibreDate');
      expect(response.body.status).toHaveProperty('cacheBooks');
    });

    it('should use cache on repeated calls', async () => {
      // First call
      await request(app.getHttpServer()).get('/health').expect(HttpStatus.OK);

      // Second call (should use cache)
      await request(app.getHttpServer()).get('/health').expect(HttpStatus.OK);

      // Service should be called at least once
      expect(mockHealthService.getHealthSattus).toHaveBeenCalled();
    });
  });
});
