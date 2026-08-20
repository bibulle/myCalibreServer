import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SeriesService } from '../series/series.service';
import { Book, BookData, findBookFormat } from '@my-calibre-server/api-interfaces';
import { HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as sharpNs from 'sharp';
// sharp 0.35 publie des types ESM (`export default`) que la résolution `node`
// du monorepo charge même en CommonJS : le namespace n'y est plus appelable.
// À l'exécution, `require('sharp')` reste la fonction elle-même ; cet alias
// rétablit donc le typage sans rien changer au code émis.
const sharp = sharpNs as unknown as typeof sharpNs.default;

describe('BooksService', () => {
  let service: BooksService;
  let calibreDbService: CalibreDb1Service;
  let usersService: UsersService;
  let seriesService: SeriesService;

  const mockCalibreDbService = {
    getBooks: jest.fn(),
    getBookById: jest.fn(),
    getBookPaths: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
    updateDownloads: jest.fn(),
    checkToken: jest.fn(),
    addDownloadedBook: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'CRON_Thumbnail_RECURRING') {
        return '*/1 * * * *'; // Every minute
      }
      return defaultValue;
    }),
  };

  const mockSchedulerRegistry = {
    addCronJob: jest.fn(),
    getCronJob: jest.fn(),
    deleteCronJob: jest.fn(),
  };

  const mockSeriesService = {
    calculateSpritesSeriesThumbnail: jest.fn(),
    getThumbnailPath: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: CalibreDb1Service,
          useValue: mockCalibreDbService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: SchedulerRegistry,
          useValue: mockSchedulerRegistry,
        },
        {
          provide: SeriesService,
          useValue: mockSeriesService,
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    calibreDbService = module.get<CalibreDb1Service>(CalibreDb1Service);
    usersService = module.get<UsersService>(UsersService);
    seriesService = module.get<SeriesService>(SeriesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBook', () => {
    it('should create a book from raw data', () => {
      const rawData = {
        book_id: 1,
        book_title: 'Test Book',
        author_name: 'John Doe',
        author_id: '1',
        book_date: '2023-01-01',
        timestamp: '2023-01-01',
        last_modified: '2023-01-01',
        data_id: '1|2',
        data_format: 'EPUB|MOBI',
        data_size: '1000|2000',
        data_name: 'book1|book2',
      };

      const book = BooksService.createBook(rawData);

      expect(book.book_title).toBe('Test Book');
      expect(book.author_name).toEqual(['John Doe']);
      expect(book.author_id).toEqual(['1']); // splitAttribute returns strings
      expect(book.data).toBeDefined();
      expect(book.data.length).toBe(2);
      expect(book.book_date).toBeInstanceOf(Date);
    });

    it('should handle books without data', () => {
      const rawData = {
        book_id: 2,
        book_title: 'Book Without Data',
        data_id: '',
        data_format: '',
        data_size: '',
        data_name: '',
        book_date: '2023-01-01',
        timestamp: '2023-01-01',
        last_modified: '2023-01-01',
      };

      const book = BooksService.createBook(rawData);

      expect(book).toBeDefined();
      expect(book.data).toEqual([]);
    });
  });

  describe('splitAttribute', () => {
    it('should split pipe-separated attributes into arrays', () => {
      const book = {
        author_name: 'John Doe|Jane Smith',
        author_id: '1|2',
      } as unknown as Book;

      BooksService['splitAttribute'](book, 'author_name');
      BooksService['splitAttribute'](book, 'author_id');

      expect(book.author_name).toEqual(['John Doe', 'Jane Smith']);
      expect(book.author_id).toEqual(['1', '2']); // splitAttribute returns strings
    });

    it('should handle empty attributes', () => {
      const book = {
        tag_name: '',
      } as unknown as Book;

      BooksService['splitAttribute'](book, 'tag_name');

      expect(book.tag_name).toEqual([]);
    });

    it('should handle single value attributes', () => {
      const book = {
        author_name: 'Single Author',
      } as unknown as Book;

      BooksService['splitAttribute'](book, 'author_name');

      expect(book.author_name).toEqual(['Single Author']);
    });
  });

  describe('getThumbnailDate', () => {
    it('should return 0 if thumbnail file does not exist', () => {
      const book = {
        book_id: 1,
        book_has_cover: true,
        book_path: 'non-existent-path',
        timestamp: new Date('2023-01-01'),
      } as unknown as Book;

      const date = service.getThumbnailDate(book);

      expect(date).toBe(0);
    });

    it('should return the file mtime (in ms) if the thumbnail file exists', () => {
      const book = {
        book_id: 1,
        book_path: 'Author/Book Title (1)',
      } as unknown as Book;
      const mtimeMs = new Date('2023-06-01').getTime();
      jest.spyOn(fs, 'statSync').mockReturnValue({ mtimeMs } as any);

      const date = service.getThumbnailDate(book);

      expect(date).toBe(mtimeMs);
    });
  });

  describe('getSpriteDate', () => {
    it('should return 0 if sprite file does not exist', () => {
      const book = {
        book_id: 1,
        book_has_cover: true,
        timestamp: new Date('2023-01-01'),
      } as unknown as Book;

      const date = service.getSpriteDate(book);

      expect(date).toBe(0);
    });

    it('should return the file mtime (in ms) if the sprite file exists', () => {
      const book = {
        book_id: 1,
      } as unknown as Book;
      const mtimeMs = new Date('2023-06-01').getTime();
      jest.spyOn(fs, 'statSync').mockReturnValue({ mtimeMs } as any);

      const date = service.getSpriteDate(book);

      expect(date).toBe(mtimeMs);
    });
  });

  describe('calculateMissingSeriesThumbnail', () => {
    it('should not skip a step/height increment when a book cover is missing on disk', async () => {
      // Reproduces the "Image to composite must have same dimensions or smaller" sharp crash:
      // step/height used to advance for every book in the series, even when its cover file was
      // absent from disk, desynchronizing the accumulated thumbnail buffer from the next overlay size.
      const books = [
        { book_id: 1, book_path: 'Author/Book1 (1)' },
        { book_id: 2, book_path: 'Author/Book2 (2)' },
        { book_id: 3, book_path: 'Author/Book3 (3)' },
      ] as unknown as Book[];

      (mockCalibreDbService as any).getAllSeries = jest.fn().mockResolvedValue([{ series_id: 10, series_name: 'Test Series', books }]);

      jest.spyOn(seriesService, 'getThumbnailPath').mockReturnValue('/thumbnails/series-10.png');

      jest.spyOn(fs, 'statSync').mockImplementation((p: any) => {
        if (String(p).includes('series-10.png')) {
          return { mtime: new Date(0) } as any;
        }
        return { mtime: new Date(2000, 0, 1) } as any;
      });

      // Book2's cover is referenced in the DB but missing on disk
      jest.spyOn(fs, 'existsSync').mockImplementation((p: any) => !String(p).includes('Book2'));

      const calculations: { step: number; height: number }[] = [];
      jest.spyOn(service, 'resizeSeries').mockImplementation(async (_srcPath: string, calculation: any) => {
        calculations.push({ step: calculation.step, height: calculation.height });
      });

      await service.calculateMissingSeriesThumbnail();

      expect(service.resizeSeries).toHaveBeenCalledTimes(2);
      expect(calculations[1].step - calculations[0].step).toBe(10);
      expect(calculations[1].height - calculations[0].height).toBe(10);
    });
  });

  describe('Cron job initialization', () => {
    it('should register cron job on service creation', () => {
      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalledWith('cronThumbnailRecurrent', expect.any(Object));
    });

    it('should use configured cron expression', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('CRON_Thumbnail_RECURRING', expect.any(String));
    });
  });

  describe('Path methods', () => {
    it('should return correct cover path', () => {
      const book = {
        book_path: 'Author Name/Book Title (123)',
      } as unknown as Book;

      const path = service.getCoverPath(book);

      expect(path).toContain('Author Name/Book Title (123)/cover.jpg');
    });

    it('should return correct thumbnail path', () => {
      const book = {
        book_path: 'Author Name/Book Title (123)',
      } as unknown as Book;

      const path = service.getThumbnailPath(book);

      expect(path).toContain('Author Name/Book Title (123)/thumbnail.jpg');
    });

    it('should return correct sprites path', () => {
      const path = service.getSpritesPath(42);

      expect(path).toContain('sprites_000042.png');
    });

    it('should pad sprites index with zeros', () => {
      const path = service.getSpritesPath(5);

      expect(path).toContain('sprites_000005.png');
    });
  });

  describe('createBookData', () => {
    it('should create book data from pipe-separated values', () => {
      const book = {
        data_id: ['1', '2'],
        data_format: ['EPUB', 'MOBI'],
        data_size: ['1000', '2000'],
        data_name: ['book1', 'book2'],
      } as any;

      BooksService.createBookData(book);

      expect(book.data).toBeDefined();
      expect(book.data.length).toBe(2);
      expect(book.data[0].data_format).toBe('EPUB');
      expect(book.data[1].data_format).toBe('MOBI');
      expect(book['data_id']).toBeUndefined();
      expect(book['data_format']).toBeUndefined();
    });

    it('should handle empty data arrays', () => {
      const book = {
        data_id: [],
        data_format: [],
        data_size: [],
        data_name: [],
      } as any;

      BooksService.createBookData(book);

      expect(book.data).toBeDefined();
      expect(book.data.length).toBe(0);
    });
  });

  describe('getBookToDownload', () => {
    let mockRes: any;

    beforeEach(() => {
      mockRes = {
        set: jest.fn(),
      };
      jest.spyOn(fs, 'createReadStream').mockReturnValue({
        on: jest.fn(),
        pipe: jest.fn(),
      } as unknown as fs.ReadStream);
    });

    it('should include series name in filename when book has a series', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockCalibreDbService.getBookPaths.mockResolvedValue({
        book_id: 1,
        book_path: 'Author/Book Title (1)',
        book_has_cover: '1',
        series_name: 'My Series',
        book_series_index: 3,
        data: [new BookData({ data_id: 1, data_format: 'EPUB', data_size: 1000, data_name: 'Book_Title' })],
      });
      mockUsersService.checkToken.mockResolvedValue(mockUser);
      mockUsersService.addDownloadedBook.mockResolvedValue(undefined);
      jest.spyOn(fsPromises, 'stat').mockResolvedValue({} as any);

      try {
        await service.getBookToDownload('valid-token', 1, mockRes, findBookFormat('EPUB'));
      } catch {
        // StreamableFile may throw because there's no real file
      }

      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Disposition': 'attachment; filename="My Series - 3 - Book_Title.epub"',
        })
      );
    });

    it('should serve a PDF-only book with the PDF content type', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockCalibreDbService.getBookPaths.mockResolvedValue({
        book_id: 4,
        book_path: 'Author/Pdf Only (4)',
        book_has_cover: '1',
        series_name: '',
        book_series_index: 0,
        data: [new BookData({ data_id: 4, data_format: 'PDF', data_size: 4000, data_name: 'Pdf_Only' })],
      });
      mockUsersService.checkToken.mockResolvedValue(mockUser);
      mockUsersService.addDownloadedBook.mockResolvedValue(undefined);
      jest.spyOn(fsPromises, 'stat').mockResolvedValue({} as any);

      try {
        await service.getBookToDownload('valid-token', 4, mockRes, findBookFormat('PDF'));
      } catch {
        // StreamableFile may throw because there's no real file
      }

      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="Pdf_Only.pdf"',
        })
      );
    });

    it('should reject a format the book does not have', async () => {
      mockCalibreDbService.getBookPaths.mockResolvedValue({
        book_id: 5,
        book_path: 'Author/Epub Only (5)',
        book_has_cover: '1',
        series_name: '',
        book_series_index: 0,
        data: [new BookData({ data_id: 5, data_format: 'EPUB', data_size: 5000, data_name: 'Epub_Only' })],
      });
      mockUsersService.checkToken.mockResolvedValue({ id: 1, username: 'testuser' });

      await expect(service.getBookToDownload('valid-token', 5, mockRes, findBookFormat('PDF'))).rejects.toMatchObject({
        status: 404,
      });
    });

    it('should use only data_name in filename when book has no series', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockCalibreDbService.getBookPaths.mockResolvedValue({
        book_id: 2,
        book_path: 'Author/Book Without Series (2)',
        book_has_cover: '1',
        series_name: '',
        book_series_index: 0,
        data: [new BookData({ data_id: 2, data_format: 'MOBI', data_size: 2000, data_name: 'Standalone_Book' })],
      });
      mockUsersService.checkToken.mockResolvedValue(mockUser);
      mockUsersService.addDownloadedBook.mockResolvedValue(undefined);
      jest.spyOn(fsPromises, 'stat').mockResolvedValue({} as any);

      try {
        await service.getBookToDownload('valid-token', 2, mockRes, findBookFormat('MOBI'));
      } catch {
        // StreamableFile may throw because there's no real file
      }

      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Disposition': 'attachment; filename="Standalone_Book.mobi"',
        })
      );
    });

    it('should sanitize special characters in series name', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockCalibreDbService.getBookPaths.mockResolvedValue({
        book_id: 3,
        book_path: 'Author/Book (3)',
        book_has_cover: '1',
        series_name: 'Series: "Special" <Edition>',
        book_series_index: 1,
        data: [new BookData({ data_id: 3, data_format: 'EPUB', data_size: 1500, data_name: 'Special_Book' })],
      });
      mockUsersService.checkToken.mockResolvedValue(mockUser);
      mockUsersService.addDownloadedBook.mockResolvedValue(undefined);
      jest.spyOn(fsPromises, 'stat').mockResolvedValue({} as any);

      try {
        await service.getBookToDownload('valid-token', 3, mockRes, findBookFormat('EPUB'));
      } catch {
        // StreamableFile may throw because there's no real file
      }

      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Disposition': 'attachment; filename="Series_ _Special_ _Edition_ - 1 - Special_Book.epub"',
        })
      );
    });

    it('should throw BAD_REQUEST when no token is provided', async () => {
      await expect(service.getBookToDownload('', 1, mockRes, findBookFormat('EPUB'))).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });

    it('should throw UNAUTHORIZED when token is invalid', async () => {
      mockUsersService.checkToken.mockResolvedValue(null);

      await expect(service.getBookToDownload('invalid-token', 1, mockRes, findBookFormat('EPUB'))).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should throw NOT_FOUND when book file is missing', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockCalibreDbService.getBookPaths.mockResolvedValue({
        book_id: 1,
        book_path: 'Author/Book Title (1)',
        book_has_cover: '1',
        series_name: '',
        book_series_index: 0,
        data: [new BookData({ data_id: 1, data_format: 'EPUB', data_size: 1000, data_name: 'Book_Title' })],
      });
      mockUsersService.checkToken.mockResolvedValue(mockUser);
      jest.spyOn(fsPromises, 'stat').mockRejectedValue(Object.assign(new Error('Missing file'), { code: 'ENOENT' }));

      await expect(service.getBookToDownload('valid-token', 1, mockRes, findBookFormat('EPUB'))).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('should throw NOT_FOUND when the book has no path or data', async () => {
      mockCalibreDbService.getBookPaths.mockResolvedValue({ book_id: 1, book_path: '', data: undefined });
      mockUsersService.checkToken.mockResolvedValue({ id: 1 });

      await expect(service.getBookToDownload('valid-token', 1, mockRes, findBookFormat('EPUB'))).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('should throw NOT_FOUND when no data matches the requested format', async () => {
      mockCalibreDbService.getBookPaths.mockResolvedValue({
        book_id: 1,
        book_path: 'Author/Book Title (1)',
        data: [new BookData({ data_id: 1, data_format: 'MOBI', data_size: 1000, data_name: 'Book_Title' })],
      });
      mockUsersService.checkToken.mockResolvedValue({ id: 1 });

      await expect(service.getBookToDownload('valid-token', 1, mockRes, findBookFormat('EPUB'))).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('should throw INTERNAL_SERVER_ERROR for an unexpected failure', async () => {
      mockCalibreDbService.getBookPaths.mockResolvedValue({
        book_id: 1,
        book_path: 'Author/Book Title (1)',
        data: [new BookData({ data_id: 1, data_format: 'EPUB', data_size: 1000, data_name: 'Book_Title' })],
      });
      mockUsersService.checkToken.mockResolvedValue({ id: 1 });
      jest.spyOn(fsPromises, 'stat').mockRejectedValue(new Error('disk exploded'));

      await expect(service.getBookToDownload('valid-token', 1, mockRes, findBookFormat('EPUB'))).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('calculateMissingBookThumbnail', () => {
    it('should regenerate the thumbnail when the cover is newer than the existing thumbnail', async () => {
      const book = { book_id: 1, book_has_cover: '1', book_path: 'Author/Book (1)', book_title: 'Book' } as unknown as Book;
      mockCalibreDbService.getBooks.mockResolvedValue([book]);
      jest.spyOn(fs, 'statSync').mockImplementation((p: any) => {
        if (String(p).includes('cover.jpg')) {
          return { mtime: new Date(2023, 0, 2) } as any;
        }
        return { mtime: new Date(2023, 0, 1) } as any;
      });
      jest.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
      const resizeImageSpy = jest.spyOn(service, 'resizeImage').mockResolvedValue(undefined);

      await service.calculateMissingBookThumbnail();

      expect(resizeImageSpy).toHaveBeenCalledTimes(1);
    });

    it('should skip books without a cover', async () => {
      const book = { book_id: 1, book_has_cover: '', book_path: 'Author/Book (1)' } as unknown as Book;
      mockCalibreDbService.getBooks.mockResolvedValue([book]);
      const resizeImageSpy = jest.spyOn(service, 'resizeImage').mockResolvedValue(undefined);

      await service.calculateMissingBookThumbnail();

      expect(resizeImageSpy).not.toHaveBeenCalled();
    });

    it('should skip a book whose thumbnail is already up to date', async () => {
      const book = { book_id: 1, book_has_cover: '1', book_path: 'Author/Book (1)' } as unknown as Book;
      mockCalibreDbService.getBooks.mockResolvedValue([book]);
      jest.spyOn(fs, 'statSync').mockImplementation((p: any) => {
        if (String(p).includes('cover.jpg')) {
          return { mtime: new Date(2023, 0, 1) } as any;
        }
        return { mtime: new Date(2023, 0, 2) } as any;
      });
      const resizeImageSpy = jest.spyOn(service, 'resizeImage').mockResolvedValue(undefined);

      await service.calculateMissingBookThumbnail();

      expect(resizeImageSpy).not.toHaveBeenCalled();
    });

    it('should log and rethrow when the database call fails', async () => {
      mockCalibreDbService.getBooks.mockRejectedValue(new Error('db down'));

      await expect(service.calculateMissingBookThumbnail()).rejects.toThrow('db down');
    });
  });

  describe('calculateSpritesBookThumbnail', () => {
    it('should build one sprite sheet per group of books that needs regeneration', async () => {
      const books = [
        { book_id: 1 },
        { book_id: 2 },
        { book_id: 60 }, // falls in a different sprite group (SPRITES_SIZE = 50)
      ] as unknown as Book[];
      mockCalibreDbService.getBooks.mockResolvedValue(books);
      // thumbnail newer than sprite => needs (re)generation for every book here
      jest.spyOn(service, 'getSpriteDate').mockReturnValue(0);
      jest.spyOn(service, 'getThumbnailDate').mockReturnValue(1);
      const createSpritesBooksSpy = jest.spyOn(service, 'createSpritesBooks').mockResolvedValue(undefined);

      await service.calculateSpritesBookThumbnail();

      expect(createSpritesBooksSpy).toHaveBeenCalledTimes(2);
      expect(createSpritesBooksSpy.mock.calls.map((c) => c[0]).sort((a, b) => a - b)).toEqual([0, 50]);
    });

    it('should skip a sprite group that is already up to date', async () => {
      const books = [{ book_id: 1 }] as unknown as Book[];
      mockCalibreDbService.getBooks.mockResolvedValue(books);
      jest.spyOn(service, 'getSpriteDate').mockReturnValue(2);
      jest.spyOn(service, 'getThumbnailDate').mockReturnValue(1);
      const createSpritesBooksSpy = jest.spyOn(service, 'createSpritesBooks').mockResolvedValue(undefined);

      await service.calculateSpritesBookThumbnail();

      expect(createSpritesBooksSpy).not.toHaveBeenCalled();
    });

    it('should log and rethrow when the database call fails', async () => {
      mockCalibreDbService.getBooks.mockRejectedValue(new Error('db down'));

      await expect(service.calculateSpritesBookThumbnail()).rejects.toThrow('db down');
    });
  });

  describe('Image processing (real sharp)', () => {
    let tmpDir: string;
    let srcImagePath: string;

    beforeEach(async () => {
      tmpDir = mkdtempSync(join(tmpdir(), 'books-service-test-'));
      srcImagePath = join(tmpDir, 'source.jpg');
      await sharp({ create: { width: 100, height: 200, channels: 3, background: { r: 255, g: 0, b: 0 } } })
        .jpeg()
        .toFile(srcImagePath);
    });

    afterEach(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    describe('resizeImage', () => {
      it('should resize the source image to the thumbnail height and write it to disk', async () => {
        const trgPath = join(tmpDir, 'nested', 'thumbnail.jpg');

        await service.resizeImage(srcImagePath, trgPath);

        expect(existsSync(trgPath)).toBe(true);
        const meta = await sharp(trgPath).metadata();
        expect(meta.height).toBe(160);
      });

      it('should log and rethrow when the source image cannot be read', async () => {
        await expect(service.resizeImage(join(tmpDir, 'missing.jpg'), join(tmpDir, 'out.jpg'))).rejects.toBeDefined();
      });
    });

    describe('saveBufferToPng', () => {
      it('should write the buffer as a resized PNG file', async () => {
        const buffer = await sharp(srcImagePath).png().toBuffer();
        const trgPath = join(tmpDir, 'series.png');

        await service.saveBufferToPng(buffer, trgPath);

        expect(existsSync(trgPath)).toBe(true);
        const meta = await sharp(trgPath).metadata();
        expect(meta.format).toBe('png');
        expect(meta.height).toBe(160);
      });
    });

    describe('getThumbnailInfo', () => {
      it('should return sharp output info for a given image', async () => {
        const info = await BooksService.getThumbnailInfo(srcImagePath);

        expect(info.height).toBe(160);
      });

      it('should reject when the image cannot be read', async () => {
        await expect(BooksService.getThumbnailInfo(join(tmpDir, 'missing.jpg'))).rejects.toBeDefined();
      });
    });

    describe('resizeSeries', () => {
      it('should initialize the buffer from the first cover', async () => {
        const calculation = { theBuffer: undefined, width: 0, height: 160, step_increment: 10, step: -10 } as any;

        await service.resizeSeries(srcImagePath, calculation);

        expect(calculation.theBuffer).toBeDefined();
        expect(calculation.width).toBeGreaterThan(0);
      });

      it('should composite a second cover onto the existing buffer', async () => {
        // Mirrors the step/height progression used by calculateMissingSeriesThumbnail,
        // which is what keeps the composited overlay within the canvas bounds.
        const calculation = { theBuffer: undefined, width: 0, height: 160, step_increment: 10, step: -10 } as any;
        calculation.step += calculation.step_increment;
        calculation.height += calculation.step;
        await service.resizeSeries(srcImagePath, calculation);
        const previousBuffer = calculation.theBuffer;

        calculation.step += calculation.step_increment;
        calculation.height += calculation.step;
        await service.resizeSeries(srcImagePath, calculation);

        expect(calculation.theBuffer).toBeDefined();
        expect(calculation.theBuffer).not.toBe(previousBuffer);
      });

      it('should shrink the buffer back down once it grows past the size limit', async () => {
        const calculation = { theBuffer: undefined, width: 0, height: 2000, step_increment: 10, step: -10 } as any;
        calculation.step += calculation.step_increment;
        await service.resizeSeries(srcImagePath, calculation);

        calculation.step += calculation.step_increment;
        calculation.height += calculation.step;
        await service.resizeSeries(srcImagePath, calculation);

        expect(calculation.height).toBeLessThan(2000);
      });

      it('should log and rethrow when the source image cannot be read', async () => {
        const calculation = { theBuffer: undefined, width: 0, height: 160, step_increment: 10, step: -10 } as any;

        await expect(service.resizeSeries(join(tmpDir, 'missing.jpg'), calculation)).rejects.toBeDefined();
      });
    });

    describe('getSpritesBooksOverlay / createSpritesBooks', () => {
      it('should build one overlay entry per book in the sprite group, using the error cover when no thumbnail exists', async () => {
        const books = [{ book_id: 0 }, { book_id: 1 }] as unknown as Book[];
        mockCalibreDbService.getBooks.mockResolvedValue(books);
        jest.spyOn(BooksService, 'getThumbnailInfo').mockResolvedValue({ width: 100 } as any);
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);

        const overlay = await service.getSpritesBooksOverlay(0);

        expect(overlay).toHaveLength(2);
        // each slot is one THUMBNAIL_HEIGHT (160px) apart, centered horizontally within its slot
        expect(overlay[1].left - overlay[0].left).toBe(160);
      });

      it('should use the real thumbnail path when one exists on disk', async () => {
        const books = [{ book_id: 1 }] as unknown as Book[];
        mockCalibreDbService.getBooks.mockResolvedValue(books);
        jest.spyOn(BooksService, 'getThumbnailInfo').mockResolvedValue({ width: 120 } as any);
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);

        const overlay = await service.getSpritesBooksOverlay(0);

        expect(overlay[0].input).toBe(service.getThumbnailPath(books[0]));
      });

      it('should fall back to the error cover info when reading the real thumbnail info fails', async () => {
        const books = [{ book_id: 1 }] as unknown as Book[];
        mockCalibreDbService.getBooks.mockResolvedValue(books);
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest
          .spyOn(BooksService, 'getThumbnailInfo')
          .mockResolvedValueOnce({ width: 90 } as any) // err_info
          .mockRejectedValueOnce('broken thumbnail');

        const overlay = await service.getSpritesBooksOverlay(0);

        expect(overlay).toHaveLength(1);
      });

      it('should propagate errors from the database', async () => {
        jest.spyOn(BooksService, 'getThumbnailInfo').mockResolvedValue({ width: 100 } as any);
        mockCalibreDbService.getBooks.mockRejectedValue('db down');

        await expect(service.getSpritesBooksOverlay(0)).rejects.toEqual('db down');
      });

      it('should assemble the sprite sheet and write it to disk', async () => {
        const spritePath = join(tmpDir, 'sprites', 'sprites_000003.png');
        jest.spyOn(service, 'getSpritesBooksOverlay').mockResolvedValue([]);
        jest.spyOn(service, 'getSpritesPath').mockReturnValue(spritePath);

        await service.createSpritesBooks(3);

        expect(existsSync(spritePath)).toBe(true);
      });

      it('should log and rethrow when building the sprite sheet fails', async () => {
        jest.spyOn(service, 'getSpritesBooksOverlay').mockRejectedValue(new Error('overlay failed'));

        await expect(service.createSpritesBooks(3)).rejects.toThrow('overlay failed');
      });
    });
  });
});
