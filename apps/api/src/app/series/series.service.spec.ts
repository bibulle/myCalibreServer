import { Test, TestingModule } from '@nestjs/testing';
import { SeriesService } from './series.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';
import { Series } from '@my-calibre-server/api-interfaces';
import { CacheService } from '../cache/cache.service';
import { BooksService } from '../books/books.service';
import * as sharpNs from 'sharp';
// sharp 0.35 publie des types ESM (`export default`) que la résolution `node`
// du monorepo charge même en CommonJS : le namespace n'y est plus appelable.
// À l'exécution, `require('sharp')` reste la fonction elle-même ; cet alias
// rétablit donc le typage sans rien changer au code émis.
const sharp = sharpNs as unknown as typeof sharpNs.default;
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
    jest.restoreAllMocks();
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

    it('should build one sprite sheet per group of series that needs regeneration', async () => {
      const series = [{ series_id: 1 }, { series_id: 2 }, { series_id: 60 }] as unknown as Series[];
      mockCalibreDbService.getAllSeries.mockResolvedValue(series);
      jest.spyOn(service, 'getSpriteDate').mockReturnValue(0);
      jest.spyOn(service, 'getThumbnailDate').mockReturnValue(1);
      const createSpritesSeriesSpy = jest.spyOn(service, 'createSpritesSeries').mockResolvedValue(undefined);

      await service.calculateSpritesSeriesThumbnail();

      expect(createSpritesSeriesSpy).toHaveBeenCalledTimes(2);
      expect(createSpritesSeriesSpy.mock.calls.map((c) => c[0]).sort((a, b) => a - b)).toEqual([0, 50]);
    });

    it('should skip a sprite group that is already up to date', async () => {
      const series = [{ series_id: 1 }] as unknown as Series[];
      mockCalibreDbService.getAllSeries.mockResolvedValue(series);
      jest.spyOn(service, 'getSpriteDate').mockReturnValue(2);
      jest.spyOn(service, 'getThumbnailDate').mockReturnValue(1);
      const createSpritesSeriesSpy = jest.spyOn(service, 'createSpritesSeries').mockResolvedValue(undefined);

      await service.calculateSpritesSeriesThumbnail();

      expect(createSpritesSeriesSpy).not.toHaveBeenCalled();
    });
  });

  describe('createSpritesSeries', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = mkdtempSync(join(tmpdir(), 'series-service-test-'));
    });

    afterEach(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should assemble the sprite sheet and write it to disk', async () => {
      const spritePath = join(tmpDir, 'sprites', 'sprites_series_000000.png');
      jest.spyOn(service, 'getSpritesPath').mockReturnValue(spritePath);
      jest.spyOn(service, 'getSpritesSeriesOverlay').mockResolvedValue([]);

      await service.createSpritesSeries(0);

      expect(existsSync(spritePath)).toBe(true);
    });

    it('should reject when building the overlay fails', async () => {
      jest.spyOn(service, 'getSpritesPath').mockReturnValue(join(tmpDir, 'sprites_series_000000.png'));
      jest.spyOn(service, 'getSpritesSeriesOverlay').mockRejectedValue(new Error('overlay failed'));

      await expect(service.createSpritesSeries(0)).rejects.toThrow('overlay failed');
    });
  });

  describe('getSpritesSeriesOverlay', () => {
    it('should build one overlay entry per series in the group, using the error cover when no thumbnail exists', async () => {
      const series = [{ series_id: 0 }, { series_id: 1 }] as unknown as Series[];
      mockCalibreDbService.getAllSeries.mockResolvedValue(series);
      jest.spyOn(BooksService, 'getThumbnailInfo').mockResolvedValue({ width: 100 } as any);
      jest.spyOn(service, 'getThumbnailPath').mockReturnValue('/does/not/exist.png');

      const overlay = await service.getSpritesSeriesOverlay(0);

      expect(overlay).toHaveLength(2);
      // each slot is one THUMBNAIL_HEIGHT (160px) apart
      expect(overlay[1].left - overlay[0].left).toBe(160);
    });

    it('should use the real thumbnail path when one exists on disk', async () => {
      const series = [{ series_id: 0 }] as unknown as Series[];
      mockCalibreDbService.getAllSeries.mockResolvedValue(series);
      jest.spyOn(BooksService, 'getThumbnailInfo').mockResolvedValue({ width: 120 } as any);
      jest.spyOn(service, 'getThumbnailPath').mockReturnValue(__filename); // any real file on disk

      const overlay = await service.getSpritesSeriesOverlay(0);

      expect(overlay[0].input).toBe(__filename);
    });

    it('should fall back to the error cover info when reading the real thumbnail info fails', async () => {
      const series = [{ series_id: 0 }] as unknown as Series[];
      mockCalibreDbService.getAllSeries.mockResolvedValue(series);
      jest.spyOn(service, 'getThumbnailPath').mockReturnValue(__filename);
      jest
        .spyOn(BooksService, 'getThumbnailInfo')
        .mockResolvedValueOnce({ width: 90 } as any) // err_info
        .mockRejectedValueOnce('broken thumbnail');

      const overlay = await service.getSpritesSeriesOverlay(0);

      expect(overlay).toHaveLength(1);
    });

    it('should propagate errors from the database', async () => {
      jest.spyOn(BooksService, 'getThumbnailInfo').mockResolvedValue({ width: 100 } as any);
      mockCalibreDbService.getAllSeries.mockRejectedValue('db down');

      await expect(service.getSpritesSeriesOverlay(0)).rejects.toEqual('db down');
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
