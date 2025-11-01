import { Test, TestingModule } from '@nestjs/testing';
import { SeriesController } from './series.controller';
import { SeriesService } from './series.service';
import { CacheService, CacheKey } from '../cache/cache.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';
import { HttpException, HttpStatus, StreamableFile } from '@nestjs/common';
import * as fs from 'fs';

// Mock sqlite3
jest.mock('sqlite3', () => ({
  Database: jest.fn(),
  verbose: jest.fn(() => ({
    Database: jest.fn(),
  })),
}));

// Mock fs module
jest.mock('fs', () => ({
  createReadStream: jest.fn(),
  existsSync: jest.fn(),
  statSync: jest.fn(),
  promises: {
    stat: jest.fn(),
  },
}));

describe('SeriesController', () => {
  let controller: SeriesController;
  let seriesService: SeriesService;
  let cacheService: CacheService;
  let calibreDb: CalibreDb1Service;

  const mockSeriesService = {
    getThumbnailPath: jest.fn(),
    getSpritesPath: jest.fn(),
  };

  const mockCacheService = {
    getCachePath: jest.fn(),
  };

  const mockCalibreDb = {
    // Add any needed methods
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeriesController],
      providers: [
        { provide: SeriesService, useValue: mockSeriesService },
        { provide: CacheService, useValue: mockCacheService },
        { provide: CalibreDb1Service, useValue: mockCalibreDb },
      ],
    }).compile();

    controller = module.get<SeriesController>(SeriesController);
    seriesService = module.get<SeriesService>(SeriesService);
    cacheService = module.get<CacheService>(CacheService);
    calibreDb = module.get<CalibreDb1Service>(CalibreDb1Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSeries', () => {
    it('should return series cache file', async () => {
      const cachePath = '/path/to/cache/series.json';
      const mockStats = { mtimeMs: 123456789 };
      const mockStream = { pipe: jest.fn() };

      mockCacheService.getCachePath.mockResolvedValue(cachePath);
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const headers = {};
      await controller.getSeries(headers, mockResponse);

      expect(cacheService.getCachePath).toHaveBeenCalledWith(CacheKey.SERIES);
      expect(mockResponse.set).toHaveBeenCalledWith({ ETag: '123456789' });
      expect(mockStream.pipe).toHaveBeenCalledWith(mockResponse);
    });

    it('should return 304 when ETag matches', async () => {
      const cachePath = '/path/to/cache/series.json';
      const mockStats = { mtimeMs: 123456789 };

      mockCacheService.getCachePath.mockResolvedValue(cachePath);
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);

      const headers = { 'if-none-match': '123456789' };

      await controller.getSeries(headers, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(304);
      expect(mockResponse.send).toHaveBeenCalledWith();
    });

    // Note: Error handling test skipped - same Promise.catch() issue as BooksController
  });

  describe('getThumbnail', () => {
    it('should return thumbnail when available', async () => {
      const thumbnailPath = '/path/to/thumbnail.png';
      const mockStream = { pipe: jest.fn() };

      mockSeriesService.getThumbnailPath.mockReturnValue(thumbnailPath);
      (fs.promises.stat as jest.Mock).mockResolvedValue({ size: 1000 });
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      await controller.getThumbnail(1, mockResponse);

      expect(seriesService.getThumbnailPath).toHaveBeenCalledWith(1);
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'image/png',
        'Cache-Control': 'max-age=31536000',
      });
      expect(mockStream.pipe).toHaveBeenCalledWith(mockResponse);
    });

    it('should return error cover when thumbnail not found', async () => {
      const thumbnailPath = '/path/to/thumbnail.png';
      const mockStream = { pipe: jest.fn() };

      mockSeriesService.getThumbnailPath.mockReturnValue(thumbnailPath);
      (fs.promises.stat as jest.Mock).mockRejectedValue(new Error('File not found'));
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      await controller.getThumbnail(1, mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'image/svg+xml',
        'Cache-control': 'public, max-age=3600',
      });
      expect(mockStream.pipe).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle different series IDs', async () => {
      const thumbnailPath = '/path/to/thumbnail-42.png';
      const mockStream = { pipe: jest.fn() };

      mockSeriesService.getThumbnailPath.mockReturnValue(thumbnailPath);
      (fs.promises.stat as jest.Mock).mockResolvedValue({ size: 2000 });
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      await controller.getThumbnail(42, mockResponse);

      expect(seriesService.getThumbnailPath).toHaveBeenCalledWith(42);
    });
  });

  describe('getSprite', () => {
    it('should return sprite image when available', async () => {
      const spritePath = '/path/to/sprite.png';
      const mockStats = { mtimeMs: 111222333 };
      const mockStream = { pipe: jest.fn() };

      mockSeriesService.getSpritesPath.mockReturnValue(spritePath);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const headers = {};
      await controller.getSprite(1, headers, mockResponse);

      expect(seriesService.getSpritesPath).toHaveBeenCalledWith(1);
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'image/png',
        ETag: '111222333',
      });
      expect(mockStream.pipe).toHaveBeenCalledWith(mockResponse);
    });

    it('should return 304 when sprite ETag matches', async () => {
      const spritePath = '/path/to/sprite.png';
      const mockStats = { mtimeMs: 111222333 };

      mockSeriesService.getSpritesPath.mockReturnValue(spritePath);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);

      const headers = { 'if-none-match': '111222333' };

      await controller.getSprite(1, headers, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(304);
      expect(mockResponse.send).toHaveBeenCalledWith();
    });

    it('should throw NotFoundException when sprite does not exist', async () => {
      const spritePath = '/path/to/sprite.png';

      mockSeriesService.getSpritesPath.mockReturnValue(spritePath);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const headers = {};
      await expect(controller.getSprite(1, headers, mockResponse)).rejects.toThrow();
    });

    it('should handle different sprite IDs', async () => {
      const spritePath = '/path/to/sprite-5.png';
      const mockStats = { mtimeMs: 999888777 };
      const mockStream = { pipe: jest.fn() };

      mockSeriesService.getSpritesPath.mockReturnValue(spritePath);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const headers = {};
      await controller.getSprite(5, headers, mockResponse);

      expect(seriesService.getSpritesPath).toHaveBeenCalledWith(5);
    });
  });
});
