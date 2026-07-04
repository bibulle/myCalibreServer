import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { CacheService, CacheKey } from './cache.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';
import { UsersService } from '../users/users.service';

describe('CacheService', () => {
  let service: CacheService;
  let tmpDir: string;

  const mockCalibreDbService = {
    getDbDate: jest.fn(),
    getBooks: jest.fn(),
    getAllAuthors: jest.fn(),
    getAllSeries: jest.fn(),
    getAllTags: jest.fn(),
    getBooksCount: jest.fn(),
    fillBooksFromUser: jest.fn(),
  };

  const mockUsersService = {
    getAll: jest.fn(),
  };

  const mockSchedulerRegistry = {
    addCronJob: jest.fn(),
    getCronJob: jest.fn(),
    deleteCronJob: jest.fn(),
  };

  let mockConfigService: { get: jest.Mock };

  beforeEach(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'cache-service-test-'));

    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'PATH_MY_CALIBRE') {
          return tmpDir;
        }
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: CalibreDb1Service, useValue: mockCalibreDbService },
        { provide: SchedulerRegistry, useValue: mockSchedulerRegistry },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register the recurring cache renewal cron job on construction', () => {
    expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalledWith('cronCacheRecurrent', expect.any(Object));
  });

  describe('getCacheDate', () => {
    it('should reject for an unknown cache key', async () => {
      await expect(service.getCacheDate('not-a-key' as unknown as CacheKey)).rejects.toEqual("Cache not found : 'not-a-key'");
    });

    it('should reject when the cache file does not exist yet', async () => {
      await expect(service.getCacheDate(CacheKey.BOOKS)).rejects.toEqual(`One cache not found : '${CacheKey.BOOKS}'`);
    });

    it('should resolve with the modification date of an existing cache file', async () => {
      const cachePath = join(tmpDir, 'cache', `${CacheKey[CacheKey.BOOKS]}.json`);
      mkdirSync(join(tmpDir, 'cache'), { recursive: true });
      writeFileSync(cachePath, '[]');

      const result = await service.getCacheDate(CacheKey.BOOKS);

      expect(result).toEqual(statSync(cachePath).mtime);
    });
  });

  describe('getCacheNumber', () => {
    it('should reject for an unknown cache key', async () => {
      await expect(service.getCacheNumber('not-a-key' as unknown as CacheKey)).rejects.toEqual("Cache not found : 'not-a-key'");
    });

    it('should reject when the cache file does not exist yet', async () => {
      await expect(service.getCacheNumber(CacheKey.COUNT)).rejects.toEqual(`One cache not found : '${CacheKey.COUNT}'`);
    });

    it('should resolve with the numeric content of an existing cache file', async () => {
      const cachePath = join(tmpDir, 'cache', `${CacheKey[CacheKey.COUNT]}.json`);
      mkdirSync(join(tmpDir, 'cache'), { recursive: true });
      writeFileSync(cachePath, '42');

      const result = await service.getCacheNumber(CacheKey.COUNT);

      expect(result).toEqual(42);
    });
  });

  describe('getCachePath', () => {
    it('should reject for an unknown cache key', async () => {
      await expect(service.getCachePath('not-a-key' as unknown as CacheKey)).rejects.toEqual("Cache not found : 'not-a-key'");
    });

    it('should build and sort the books cache, then persist it to disk', async () => {
      const books = [
        { series_name: null, series_sort: '', book_series_index: 0, book_sort: 'Zebra' },
        { series_name: null, series_sort: '', book_series_index: 0, book_sort: 'Alpha' },
      ];
      mockCalibreDbService.getBooks.mockResolvedValue(books);
      mockUsersService.getAll.mockResolvedValue([]);
      mockCalibreDbService.fillBooksFromUser.mockResolvedValue(books);

      const cachePath = await service.getCachePath(CacheKey.BOOKS, new Date());

      expect(mockCalibreDbService.getBooks).toHaveBeenCalled();
      expect(mockCalibreDbService.fillBooksFromUser).toHaveBeenCalledWith(books, expect.any(Promise), true);
      expect(existsSync(cachePath)).toBe(true);
      const written = JSON.parse(readFileSync(cachePath, 'utf-8'));
      expect(written.books).toEqual(books);
    });

    it('should build the new-books cache without sorting', async () => {
      const books = [{ book_sort: 'Zebra' }, { book_sort: 'Alpha' }];
      mockCalibreDbService.getBooks.mockResolvedValue(books);
      mockUsersService.getAll.mockResolvedValue([]);
      mockCalibreDbService.fillBooksFromUser.mockResolvedValue(books);

      await service.getCachePath(CacheKey.NEW_BOOKS, new Date());

      expect(mockCalibreDbService.getBooks).toHaveBeenCalledWith(200, 0);
    });

    it('should build and sort the authors cache', async () => {
      const authors = [
        { author_sort: 'Zebra', author_name: 'Zebra' },
        { author_sort: 'Alpha', author_name: 'Alpha' },
      ];
      mockCalibreDbService.getAllAuthors.mockResolvedValue(authors);
      mockUsersService.getAll.mockResolvedValue([]);
      mockCalibreDbService.fillBooksFromUser.mockResolvedValue(authors);

      const cachePath = await service.getCachePath(CacheKey.AUTHORS, new Date());

      const written = JSON.parse(readFileSync(cachePath, 'utf-8'));
      expect(written.authors.map((a: { author_sort: string }) => a.author_sort)).toEqual(['Alpha', 'Zebra']);
    });

    it('should build and sort the series cache', async () => {
      const series = [{ series_sort: 'Zebra' }, { series_sort: 'Alpha' }];
      mockCalibreDbService.getAllSeries.mockResolvedValue(series);
      mockUsersService.getAll.mockResolvedValue([]);
      mockCalibreDbService.fillBooksFromUser.mockResolvedValue(series);

      const cachePath = await service.getCachePath(CacheKey.SERIES, new Date());

      const written = JSON.parse(readFileSync(cachePath, 'utf-8'));
      expect(written.series.map((s: { series_sort: string }) => s.series_sort)).toEqual(['Alpha', 'Zebra']);
    });

    it('should build and sort the tags cache', async () => {
      const tags = [{ tag_name: 'Zebra' }, { tag_name: 'Alpha' }];
      mockCalibreDbService.getAllTags.mockResolvedValue(tags);
      mockUsersService.getAll.mockResolvedValue([]);
      mockCalibreDbService.fillBooksFromUser.mockResolvedValue(tags);

      const cachePath = await service.getCachePath(CacheKey.TAGS, new Date());

      const written = JSON.parse(readFileSync(cachePath, 'utf-8'));
      expect(written.tags.map((t: { tag_name: string }) => t.tag_name)).toEqual(['Alpha', 'Zebra']);
    });

    it('should persist a numeric result (count) without going through the array branch', async () => {
      mockCalibreDbService.getBooksCount.mockResolvedValue(7);

      const cachePath = await service.getCachePath(CacheKey.COUNT, new Date());

      expect(readFileSync(cachePath, 'utf-8')).toEqual('7');
      expect(mockCalibreDbService.fillBooksFromUser).not.toHaveBeenCalled();
    });

    it('should resolve immediately without recalculating when the cache is already fresher than dbDate', async () => {
      mockCalibreDbService.getBooksCount.mockResolvedValue(1);
      await service.getCachePath(CacheKey.COUNT, new Date(2024, 0, 1));
      mockCalibreDbService.getBooksCount.mockClear();

      const cachePath = await service.getCachePath(CacheKey.COUNT, new Date(1));

      expect(mockCalibreDbService.getBooksCount).not.toHaveBeenCalled();
      expect(cachePath).toContain(`${CacheKey[CacheKey.COUNT]}.json`);
    });

    it('should reject when the underlying database call fails', async () => {
      mockCalibreDbService.getBooksCount.mockRejectedValue('db error');

      await expect(service.getCachePath(CacheKey.COUNT, new Date())).rejects.toEqual('db error');
    });

    it('should reject when filling books from user fails', async () => {
      mockCalibreDbService.getBooks.mockResolvedValue([{ book_sort: 'A' }]);
      mockUsersService.getAll.mockResolvedValue([]);
      mockCalibreDbService.fillBooksFromUser.mockRejectedValue('fill error');

      await expect(service.getCachePath(CacheKey.BOOKS, new Date())).rejects.toEqual('fill error');
    });
  });

  describe('renewCacheIfNeeded', () => {
    it('should renew every cache table based on the current db date', async () => {
      mockCalibreDbService.getDbDate.mockResolvedValue(new Date());
      const getCachePathSpy = jest.spyOn(service, 'getCachePath').mockResolvedValue('/some/path');

      service.renewCacheIfNeeded();
      await new Promise((resolve) => setImmediate(resolve));

      expect(getCachePathSpy).toHaveBeenCalledTimes(6);
    });

    it('should log an error when renewal fails', async () => {
      mockCalibreDbService.getDbDate.mockResolvedValue(new Date());
      jest.spyOn(service, 'getCachePath').mockRejectedValue('boom');
      const loggerErrorSpy = jest.spyOn((service as unknown as { logger: { error: jest.Mock } }).logger, 'error').mockImplementation(() => undefined);

      service.renewCacheIfNeeded();
      await new Promise((resolve) => setImmediate(resolve));

      expect(loggerErrorSpy).toHaveBeenCalledWith('boom');
    });
  });

  describe('renewCacheForced', () => {
    it('should renew every cache table using a far-future db date', async () => {
      const getCachePathSpy = jest.spyOn(service, 'getCachePath').mockResolvedValue('/some/path');

      service.renewCacheForced();
      await new Promise((resolve) => setImmediate(resolve));

      expect(getCachePathSpy).toHaveBeenCalledTimes(6);
      expect(getCachePathSpy.mock.calls[0][1]).toEqual(new Date(2100, 0, 1));
    });

    it('should log an error when forced renewal fails', async () => {
      jest.spyOn(service, 'getCachePath').mockRejectedValue('boom');
      const loggerErrorSpy = jest.spyOn((service as unknown as { logger: { error: jest.Mock } }).logger, 'error').mockImplementation(() => undefined);

      service.renewCacheForced();
      await new Promise((resolve) => setImmediate(resolve));

      expect(loggerErrorSpy).toHaveBeenCalledWith('boom');
    });
  });
});
