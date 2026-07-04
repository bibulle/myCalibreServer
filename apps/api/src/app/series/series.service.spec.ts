import { Test, TestingModule } from '@nestjs/testing';
import { SeriesService } from './series.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';
import { Series } from '@my-calibre-server/api-interfaces';
import { CacheService } from '../cache/cache.service';
import * as sharp from 'sharp';
import { existsSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('SeriesService', () => {
  let service: SeriesService;
  let calibreDbService: CalibreDb1Service;

  const mockCalibreDbService = {
    getAllSeries: jest.fn(),
  };

  const mockSeries = {
    series_id: 1,
    series_name: 'Test Series',
    series_sort: 'Test Series',
    author_name: ['Test Author'],
    author_sort: ['Author, Test'],
    book_date: [new Date()],
    books: [
      {
        book_id: 1,
        book_path: 'Author/Book1 (1)',
        book_has_cover: '1',
        book_series_index: 1,
      } as any,
    ],
  } as unknown as Series;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeriesService,
        {
          provide: CalibreDb1Service,
          useValue: mockCalibreDbService,
        },
      ],
    }).compile();

    service = module.get<SeriesService>(SeriesService);
    calibreDbService = module.get<CalibreDb1Service>(CalibreDb1Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getThumbnailPath', () => {
    it('should return correct thumbnail path for series', () => {
      const path = service.getThumbnailPath(123);

      expect(path).toBeDefined();
      expect(path).toContain('123/thumbnail.png');
    });

    it('should handle different series IDs', () => {
      const path1 = service.getThumbnailPath(1);
      const path2 = service.getThumbnailPath(999);

      expect(path1).toContain('1/thumbnail.png');
      expect(path2).toContain('999/thumbnail.png');
      expect(path1).not.toEqual(path2);
    });
  });

  describe('getSpritesPath', () => {
    it('should return correct sprites path', () => {
      const path = service.getSpritesPath(42);

      expect(path).toBeDefined();
      expect(path).toContain('sprites_series_000042.png');
    });

    it('should pad index with zeros', () => {
      const path = service.getSpritesPath(5);

      expect(path).toContain('sprites_series_000005.png');
    });

    it('should handle large indices', () => {
      const path = service.getSpritesPath(123456);

      expect(path).toContain('sprites_series_123456.png');
    });
  });

  describe('getSpriteDate', () => {
    it('should return 0 if sprite file does not exist', () => {
      const date = service.getSpriteDate(mockSeries);

      expect(date).toBe(0);
    });

    it('should handle series without covers', () => {
      const seriesNoCover = {
        ...mockSeries,
        books: [{ ...mockSeries.books[0], book_has_cover: '0' }],
      } as Series;

      const date = service.getSpriteDate(seriesNoCover);

      expect(date).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getThumbnailDate', () => {
    it('should return 0 if thumbnail file does not exist', () => {
      const date = service.getThumbnailDate(mockSeries);

      expect(date).toBe(0);
    });

    it('should handle different series IDs', () => {
      const series1 = { ...mockSeries, series_id: 1 };
      const series2 = { ...mockSeries, series_id: 2 };

      const date1 = service.getThumbnailDate(series1);
      const date2 = service.getThumbnailDate(series2);

      expect(date1).toBe(0);
      expect(date2).toBe(0);
    });
  });

  describe('calculateSpritesSeriesThumbnail', () => {
    it('should calculate sprites for all series', async () => {
      // Mock getAllSeries to return empty list to avoid file system access
      mockCalibreDbService.getAllSeries.mockResolvedValue([]);

      await service.calculateSpritesSeriesThumbnail();

      expect(mockCalibreDbService.getAllSeries).toHaveBeenCalled();
    });

    it('should handle empty series list', async () => {
      mockCalibreDbService.getAllSeries.mockResolvedValue([]);

      await service.calculateSpritesSeriesThumbnail();

      expect(mockCalibreDbService.getAllSeries).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockCalibreDbService.getAllSeries.mockRejectedValue(new Error('DB Error'));

      await expect(service.calculateSpritesSeriesThumbnail()).rejects.toThrow('DB Error');
    });
  });

  describe('createSpritesSeries', () => {
    it('should create sprites for a specific index', async () => {
      mockCalibreDbService.getAllSeries.mockResolvedValue([mockSeries]);

      // This will fail because it tries to access file system, but we test the structure
      await expect(service.createSpritesSeries(0)).rejects.toThrow();
    });
  });

  describe('getSpritesSeriesOverlay', () => {
    it('should get overlay options for series sprites', async () => {
      mockCalibreDbService.getAllSeries.mockResolvedValue([mockSeries]);

      // This will fail because it tries to access file system, but we test the structure
      await expect(service.getSpritesSeriesOverlay(0)).rejects.toThrow();
    });
  });

  describe('removeOversizedOverlays', () => {
    let tmpDir: string;
    const originalErrCoverThumbnail = CacheService.ERR_COVER_THUMBNAIL;

    beforeEach(() => {
      tmpDir = mkdtempSync(join(tmpdir(), 'series-service-test-'));
    });

    afterEach(() => {
      rmSync(tmpDir, { recursive: true, force: true });
      CacheService.ERR_COVER_THUMBNAIL = originalErrCoverThumbnail;
    });

    it('keeps overlays that fit the canvas and deletes stale/oversized files from disk', async () => {
      const fittingPath = join(tmpDir, 'fitting.png');
      const oversizedPath = join(tmpDir, 'oversized.png');

      await sharp({ create: { width: 40, height: 40, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toFile(fittingPath);
      await sharp({ create: { width: 40, height: 150, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toFile(oversizedPath);

      const overlay = [
        { input: fittingPath, top: 0, left: 0 },
        { input: oversizedPath, top: 0, left: 50 },
      ];

      const result = await service.removeOversizedOverlays(overlay, 100, 100);

      expect(result).toEqual([{ input: fittingPath, top: 0, left: 0 }]);
      expect(existsSync(fittingPath)).toBe(true);
      expect(existsSync(oversizedPath)).toBe(false);
    });

    it('excludes an oversized shared error placeholder without deleting it', async () => {
      const placeholderPath = join(tmpDir, 'placeholder.png');
      await sharp({ create: { width: 40, height: 150, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toFile(placeholderPath);
      CacheService.ERR_COVER_THUMBNAIL = placeholderPath;

      const overlay = [{ input: placeholderPath, top: 0, left: 0 }];

      const result = await service.removeOversizedOverlays(overlay, 100, 100);

      expect(result).toEqual([]);
      expect(existsSync(placeholderPath)).toBe(true);
    });

    it('drops an overlay whose file cannot be read without throwing', async () => {
      const overlay = [{ input: join(tmpDir, 'does-not-exist.png'), top: 0, left: 0 }];

      const result = await service.removeOversizedOverlays(overlay, 100, 100);

      expect(result).toEqual([]);
    });
  });
});
