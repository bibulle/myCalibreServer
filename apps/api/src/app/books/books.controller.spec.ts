import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { CacheService, CacheKey } from '../cache/cache.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../utils/mail.service';
import { HttpException, HttpStatus, StreamableFile } from '@nestjs/common';
import { createReadStream } from 'fs';
import * as fs from 'fs';

// Mock sqlite3 to avoid native module loading issues
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

describe('BooksController', () => {
  let controller: BooksController;
  let booksService: BooksService;
  let cacheService: CacheService;
  let calibreDb: CalibreDb1Service;
  let usersService: UsersService;
  let mailService: MailService;

  const mockBooksService = {
    getCoverPath: jest.fn(),
    getThumbnailPath: jest.fn(),
    getSpritesPath: jest.fn(),
    getBookToDownload: jest.fn(),
  };

  const mockCacheService = {
    getCachePath: jest.fn(),
  };

  const mockCalibreDb = {
    getBook: jest.fn(),
    getBookPaths: jest.fn(),
  };

  const mockUsersService = {
    getAll: jest.fn(),
    addRatingBook: jest.fn(),
    createTemporaryToken: jest.fn(),
    addDownloadedBook: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockMailService = {
    sendMail: jest.fn(),
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };

  const mockRequest = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      roles: ['user'],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        { provide: BooksService, useValue: mockBooksService },
        { provide: CacheService, useValue: mockCacheService },
        { provide: CalibreDb1Service, useValue: mockCalibreDb },
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    controller = module.get<BooksController>(BooksController);
    booksService = module.get<BooksService>(BooksService);
    cacheService = module.get<CacheService>(CacheService);
    calibreDb = module.get<CalibreDb1Service>(CalibreDb1Service);
    usersService = module.get<UsersService>(UsersService);
    mailService = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBooks', () => {
    it('should return books cache file', async () => {
      const cachePath = '/path/to/cache/books.json';
      const mockStats = { mtimeMs: 123456789 };
      const mockStream = { pipe: jest.fn() };

      mockCacheService.getCachePath.mockResolvedValue(cachePath);
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const headers = {};
      const result = await controller.getBooks(headers, mockResponse);

      expect(cacheService.getCachePath).toHaveBeenCalledWith(CacheKey.BOOKS);
      expect(mockResponse.set).toHaveBeenCalledWith({ ETag: '123456789' });
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('should return 304 when ETag matches', async () => {
      const cachePath = '/path/to/cache/books.json';
      const mockStats = { mtimeMs: 123456789 };

      mockCacheService.getCachePath.mockResolvedValue(cachePath);
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);

      const headers = { 'if-none-match': '123456789' };

      // The controller returns early with 304, no StreamableFile returned
      const result = controller.getBooks(headers, mockResponse);

      // Wait a bit for the promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockResponse.status).toHaveBeenCalledWith(304);
      expect(mockResponse.send).toHaveBeenCalledWith('No change');
    });

    it('should throw HttpException on cache error', async () => {
      mockCacheService.getCachePath.mockRejectedValue(new Error('Cache error'));

      const headers = {};

      try {
        await controller.getBooks(headers, mockResponse);
        fail('Should have thrown HttpException');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });

  describe('new', () => {
    it('should return new books cache file', async () => {
      const cachePath = '/path/to/cache/new-books.json';
      const mockStats = { mtimeMs: 987654321 };
      const mockStream = { pipe: jest.fn() };

      mockCacheService.getCachePath.mockResolvedValue(cachePath);
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const headers = {};
      const result = await controller.new(headers, mockResponse);

      expect(cacheService.getCachePath).toHaveBeenCalledWith(CacheKey.NEW_BOOKS);
      expect(mockResponse.set).toHaveBeenCalledWith({ ETag: '987654321' });
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('should return 304 for new books when ETag matches', async () => {
      const cachePath = '/path/to/cache/new-books.json';
      const mockStats = { mtimeMs: 987654321 };

      mockCacheService.getCachePath.mockResolvedValue(cachePath);
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);

      const headers = { 'if-none-match': '987654321' };

      // The controller returns early with 304
      controller.new(headers, mockResponse);

      // Wait a bit for the promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockResponse.status).toHaveBeenCalledWith(304);
      expect(mockResponse.send).toHaveBeenCalledWith('No change');
    });
  });

  describe('getBook', () => {
    it('should return a single book by id', async () => {
      const mockBook = {
        book_id: 1,
        book_title: 'Test Book',
        book_author: 'Test Author',
      };

      mockCalibreDb.getBook.mockResolvedValue(mockBook);
      const usersPromise = Promise.resolve([]);
      mockUsersService.getAll.mockReturnValue(usersPromise);

      const result = await controller.getBook(1);

      expect(calibreDb.getBook).toHaveBeenCalledWith(1, usersPromise);
      expect(result).toEqual({ book: mockBook });
    });

    it('should throw HttpException when book not found', async () => {
      mockCalibreDb.getBook.mockRejectedValue(new Error('Book not found'));
      mockUsersService.getAll.mockReturnValue(Promise.resolve([]));

      try {
        await controller.getBook(999);
        fail('Should have thrown HttpException');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });

  describe('getCover', () => {
    it('should return cover image when available', async () => {
      const mockBookPath = {
        book_id: 1,
        book_path: 'Author/Book Title (1)',
        book_has_cover: true,
      };
      const coverPath = '/path/to/cover.jpg';
      const mockStream = { pipe: jest.fn() };

      mockCalibreDb.getBookPaths.mockResolvedValue(mockBookPath);
      mockBooksService.getCoverPath.mockReturnValue(coverPath);
      (fs.promises.stat as jest.Mock).mockResolvedValue({ size: 1000 });
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const result = await controller.getCover(1, mockResponse);

      expect(calibreDb.getBookPaths).toHaveBeenCalledWith(1);
      expect(booksService.getCoverPath).toHaveBeenCalledWith(mockBookPath);
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'image/jpg',
        'Cache-control': 'public, max-age=3600',
      });
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('should return error cover when cover file not found', async () => {
      const mockBookPath = {
        book_id: 1,
        book_path: 'Author/Book Title (1)',
        book_has_cover: true,
      };
      const coverPath = '/path/to/cover.jpg';
      const mockStream = { pipe: jest.fn() };

      mockCalibreDb.getBookPaths.mockResolvedValue(mockBookPath);
      mockBooksService.getCoverPath.mockReturnValue(coverPath);
      (fs.promises.stat as jest.Mock).mockRejectedValue(new Error('File not found'));
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const result = await controller.getCover(1, mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'image/svg+xml',
        'Cache-control': 'public, max-age=3600',
      });
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('should return error cover when book has no cover', async () => {
      const mockBookPath = {
        book_id: 1,
        book_path: 'Author/Book Title (1)',
        book_has_cover: false,
      };
      const mockStream = { pipe: jest.fn() };

      mockCalibreDb.getBookPaths.mockResolvedValue(mockBookPath);
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const result = await controller.getCover(1, mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'image/svg+xml',
        'Cache-control': 'public, max-age=3600',
      });
      expect(result).toBeInstanceOf(StreamableFile);
    });
  });

  describe('getThumbnail', () => {
    it('should return thumbnail when available', async () => {
      const mockBookPath = {
        book_id: 1,
        book_path: 'Author/Book Title (1)',
        book_has_cover: true,
      };
      const thumbnailPath = '/path/to/thumbnail.jpg';
      const mockStream = { pipe: jest.fn() };

      mockCalibreDb.getBookPaths.mockResolvedValue(mockBookPath);
      mockBooksService.getThumbnailPath.mockReturnValue(thumbnailPath);
      (fs.promises.stat as jest.Mock).mockResolvedValue({ size: 1000 });
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const result = await controller.getThumbnail(1, mockResponse);

      expect(booksService.getThumbnailPath).toHaveBeenCalledWith(mockBookPath);
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'image/jpg',
        'Cache-Control': 'max-age=31536000',
      });
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('should fallback to cover when thumbnail not found', async () => {
      const mockBookPath = {
        book_id: 1,
        book_path: 'Author/Book Title (1)',
        book_has_cover: true,
      };
      const thumbnailPath = '/path/to/thumbnail.jpg';
      const coverPath = '/path/to/cover.jpg';
      const mockStream = { pipe: jest.fn() };

      mockCalibreDb.getBookPaths.mockResolvedValue(mockBookPath);
      mockBooksService.getThumbnailPath.mockReturnValue(thumbnailPath);
      mockBooksService.getCoverPath.mockReturnValue(coverPath);
      (fs.promises.stat as jest.Mock).mockRejectedValueOnce(new Error('Thumbnail not found')).mockResolvedValueOnce({ size: 1000 });
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const result = await controller.getThumbnail(1, mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'image/jpg',
        'Cache-control': 'public, max-age=3600',
      });
      expect(result).toBeInstanceOf(StreamableFile);
    });
  });

  describe('getSprite', () => {
    it('should return sprite image when available', async () => {
      const spritePath = '/path/to/sprite.png';
      const mockStats = { mtimeMs: 111222333 };
      const mockStream = { pipe: jest.fn() };

      mockBooksService.getSpritesPath.mockReturnValue(spritePath);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const headers = {};
      const result = await controller.getSprite(1, headers, mockResponse);

      expect(booksService.getSpritesPath).toHaveBeenCalledWith(1);
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'image/png',
        ETag: '111222333',
      });
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('should return 304 when sprite ETag matches', async () => {
      const spritePath = '/path/to/sprite.png';
      const mockStats = { mtimeMs: 111222333 };

      mockBooksService.getSpritesPath.mockReturnValue(spritePath);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);

      const headers = { 'if-none-match': '111222333' };

      // The controller returns early with 304
      controller.getSprite(1, headers, mockResponse);

      // Wait a bit for the promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockResponse.status).toHaveBeenCalledWith(304);
      expect(mockResponse.send).toHaveBeenCalledWith('No change');
    });

    it('should throw NotFoundException when sprite does not exist', async () => {
      const spritePath = '/path/to/sprite.png';

      mockBooksService.getSpritesPath.mockReturnValue(spritePath);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const headers = {};
      await expect(controller.getSprite(1, headers, mockResponse)).rejects.toThrow();
    });
  });

  describe('getEpub', () => {
    it('should download EPUB file', async () => {
      const mockStream = { pipe: jest.fn() };
      const mockStreamableFile = new StreamableFile(mockStream as any);
      mockBooksService.getBookToDownload.mockResolvedValue(mockStreamableFile);

      const result = await controller.getEpub(1, 'test-token', mockResponse);

      expect(booksService.getBookToDownload).toHaveBeenCalledWith('test-token', 1, mockResponse, 'EPUB', 'application/epub+zip');
      expect(result).toBe(mockStreamableFile);
    });
  });

  describe('getMobi', () => {
    it('should download MOBI file', async () => {
      const mockStream = { pipe: jest.fn() };
      const mockStreamableFile = new StreamableFile(mockStream as any);
      mockBooksService.getBookToDownload.mockResolvedValue(mockStreamableFile);

      const result = await controller.getMobi(1, 'test-token', mockResponse);

      expect(booksService.getBookToDownload).toHaveBeenCalledWith('test-token', 1, mockResponse, 'MOBI', 'application/x-mobipocket-ebook');
      expect(result).toBe(mockStreamableFile);
    });
  });

  describe('setRating', () => {
    it('should save book rating', async () => {
      const mockBookPath = {
        book_id: 1,
        book_path: 'Author/Book Title (1)',
        data: [{ data_name: 'Book Title', data_format: 'EPUB' }],
      };

      mockCalibreDb.getBookPaths.mockResolvedValue(mockBookPath);
      mockUsersService.addRatingBook.mockResolvedValue(undefined);

      const result = await controller.setRating(1, 5, mockRequest);

      expect(calibreDb.getBookPaths).toHaveBeenCalledWith(1);
      expect(usersService.addRatingBook).toHaveBeenCalledWith(mockRequest.user, 1, 'Book Title', 5);
      expect(result).toEqual({ ok: 'Rating saved' });
    });

    it('should throw BadRequest when rating is missing', async () => {
      await expect(controller.setRating(1, null, mockRequest)).rejects.toThrow(new HttpException('Bad request', HttpStatus.BAD_REQUEST));
    });

    it('should throw NotFound when book not found', async () => {
      mockCalibreDb.getBookPaths.mockRejectedValue(new Error('Book not found'));

      try {
        await controller.setRating(1, 5, mockRequest);
        fail('Should have thrown HttpException');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });
  });

  describe('getEpubUrl', () => {
    it('should return temporary token for download', async () => {
      const mockToken = 'temporary-download-token-123';
      mockUsersService.createTemporaryToken.mockReturnValue(mockToken);

      const result = await controller.getEpubUrl(1, mockRequest);

      expect(usersService.createTemporaryToken).toHaveBeenCalledWith(mockRequest.user);
      expect(result).toEqual({ id_token: mockToken });
    });

    it('should throw Unauthorized when user not found', async () => {
      const requestWithoutUser = { user: null };

      await expect(controller.getEpubUrl(1, requestWithoutUser)).rejects.toThrow(new HttpException('Something go wrong', HttpStatus.UNAUTHORIZED));
    });
  });

  describe('sendKindle', () => {
    it('should send book to Kindle email', async () => {
      const mockBookPath = {
        book_id: 1,
        book_path: 'Author/Book Title (1)',
        data: [{ data_name: 'Book Title', data_format: 'EPUB' }],
      };

      mockCalibreDb.getBookPaths.mockResolvedValue(mockBookPath);
      (fs.promises.stat as jest.Mock).mockResolvedValue({ size: 1000 });
      mockUsersService.addDownloadedBook.mockResolvedValue(undefined);
      mockMailService.sendMail.mockResolvedValue(undefined);

      const result = await controller.sendKindle(1, 'user@kindle.com', mockRequest);

      expect(calibreDb.getBookPaths).toHaveBeenCalledWith(1);
      expect(usersService.addDownloadedBook).toHaveBeenCalled();
      expect(mailService.sendMail).toHaveBeenCalledWith('user@kindle.com', 'My books', 'This book was sent to you by myCalibre.', 'Book Title.epub', expect.any(String));
      expect(result).toEqual({ ok: 'Book sent' });
    });

    it('should throw Unauthorized when user not found', async () => {
      const requestWithoutUser = { user: null };

      await expect(controller.sendKindle(1, 'user@kindle.com', requestWithoutUser)).rejects.toThrow(new HttpException('Something go wrong', HttpStatus.UNAUTHORIZED));
    });

    it('should throw BadRequest when mail is missing', async () => {
      await expect(controller.sendKindle(1, null, mockRequest)).rejects.toThrow(new HttpException('Something go wrong', HttpStatus.BAD_REQUEST));
    });

    it('should throw error when book not found', async () => {
      mockCalibreDb.getBookPaths.mockResolvedValue(null);

      await expect(controller.sendKindle(1, 'user@kindle.com', mockRequest)).rejects.toThrow(HttpException);
    });

    it('should throw error when EPUB format not available', async () => {
      const mockBookPath = {
        book_id: 1,
        book_path: 'Author/Book Title (1)',
        data: [{ data_name: 'Book Title', data_format: 'MOBI' }],
      };

      mockCalibreDb.getBookPaths.mockResolvedValue(mockBookPath);

      await expect(controller.sendKindle(1, 'user@kindle.com', mockRequest)).rejects.toThrow(HttpException);
    });
  });
});
