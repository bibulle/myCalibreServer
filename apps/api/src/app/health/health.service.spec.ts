import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { CacheService, CacheKey } from '../cache/cache.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';

describe('HealthService', () => {
  let service: HealthService;
  let cacheService: CacheService;
  let calibreDbService: CalibreDb1Service;

  const mockCacheService = {
    getCacheDate: jest.fn(),
  };

  const mockCalibreDbService = {
    getDbDate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: CalibreDb1Service,
          useValue: mockCalibreDbService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    cacheService = module.get<CacheService>(CacheService);
    calibreDbService = module.get<CalibreDb1Service>(CalibreDb1Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealthSattus', () => {
    // Augmenter le timeout pour les tests qui testent les timeouts
    jest.setTimeout(15000);

    it('should return status with calibre date and cache books date', async () => {
      const mockDbDate = new Date('2023-07-13T08:26:34.000Z');
      const mockCacheDate = new Date('2023-07-13T10:00:00.000Z');

      mockCalibreDbService.getDbDate.mockResolvedValue(mockDbDate);
      mockCacheService.getCacheDate.mockResolvedValue(mockCacheDate);

      const result = await service.getHealthSattus();

      expect(result).toBeDefined();
      expect(result.calibreDate).toEqual(mockDbDate);
      expect(result.cacheBooks).toEqual(mockCacheDate);
      expect(mockCalibreDbService.getDbDate).toHaveBeenCalled();
      expect(mockCacheService.getCacheDate).toHaveBeenCalledWith(CacheKey.BOOKS);
    });

    it('should handle database timeout gracefully', async () => {
      // Simuler un timeout en ne résolvant jamais la promesse
      mockCalibreDbService.getDbDate.mockImplementation(
        () => new Promise(() => {}) // Promesse qui ne se résout jamais
      );
      mockCacheService.getCacheDate.mockResolvedValue(new Date());

      const result = await service.getHealthSattus();

      expect(result).toBeDefined();
      // Avec le timeout, la valeur devrait être null, donc calibreStatus devrait contenir "Timeout" ou "unavailable"
      expect(result.calibreStatus).toMatch(/Timeout|unavailable/);
    });

    it('should handle cache timeout gracefully', async () => {
      mockCalibreDbService.getDbDate.mockResolvedValue(new Date());
      mockCacheService.getCacheDate.mockImplementation(
        () => new Promise(() => {}) // Promesse qui ne se résout jamais
      );

      const result = await service.getHealthSattus();

      expect(result).toBeDefined();
      expect(result.cacheStatus).toMatch(/Timeout|unavailable/);
    }, 10000);

    it('should complete in less than 6 seconds with timeouts', async () => {
      // Simuler des promesses qui ne se résolvent jamais (timeout)
      mockCalibreDbService.getDbDate.mockImplementation(() => new Promise(() => {}));
      mockCacheService.getCacheDate.mockImplementation(() => new Promise(() => {}));

      const startTime = Date.now();
      await service.getHealthSattus();
      const duration = Date.now() - startTime;

      // Should complete in ~5s (timeout) not wait forever
      expect(duration).toBeLessThan(6000);
      expect(duration).toBeGreaterThan(4000); // Au moins 5s pour les timeouts
    }, 15000);

    it('should use cache on repeated calls within 30 seconds', async () => {
      const mockDbDate = new Date('2023-07-13T08:26:34.000Z');
      const mockCacheDate = new Date('2023-07-13T10:00:00.000Z');

      mockCalibreDbService.getDbDate.mockResolvedValue(mockDbDate);
      mockCacheService.getCacheDate.mockResolvedValue(mockCacheDate);

      // First call
      const result1 = await service.getHealthSattus();

      // Second call (should use cache)
      const result2 = await service.getHealthSattus();

      expect(result1).toEqual(result2);
      // Should only call services once due to cache
      expect(mockCalibreDbService.getDbDate).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors', async () => {
      mockCalibreDbService.getDbDate.mockRejectedValue(new Error('Database connection failed'));
      mockCacheService.getCacheDate.mockResolvedValue(new Date());

      const result = await service.getHealthSattus();

      expect(result).toBeDefined();
      expect(result.calibreStatus).toContain('KO');
    });

    it('should log execution time', async () => {
      const mockDbDate = new Date();
      const mockCacheDate = new Date();

      mockCalibreDbService.getDbDate.mockResolvedValue(mockDbDate);
      mockCacheService.getCacheDate.mockResolvedValue(mockCacheDate);

      const logSpy = jest.spyOn(service['logger'], 'log');

      await service.getHealthSattus();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Health check completed in'));
    });
  });
});
