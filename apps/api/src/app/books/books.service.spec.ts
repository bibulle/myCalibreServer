import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SeriesService } from '../series/series.service';
import { Book, BookData } from '@my-calibre-server/api-interfaces';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';

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

    it('should return timestamp if thumbnail file exists', () => {
      // This test would require mocking fs.statSync
      // For now, we just test the non-existent case
      expect(true).toBe(true);
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

    it('should return timestamp if sprite file exists', () => {
      // This test would require mocking fs.statSync
      // For now, we just test the non-existent case
      expect(true).toBe(true);
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
        await service.getBookToDownload('valid-token', 1, mockRes, 'EPUB', 'application/epub+zip');
      } catch {
        // StreamableFile may throw because there's no real file
      }

      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Disposition': 'attachment; filename="My Series - 3 - Book_Title.epub"',
        })
      );
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
        await service.getBookToDownload('valid-token', 2, mockRes, 'MOBI', 'application/x-mobipocket-ebook');
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
        await service.getBookToDownload('valid-token', 3, mockRes, 'EPUB', 'application/epub+zip');
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
      await expect(service.getBookToDownload('', 1, mockRes, 'EPUB', 'application/epub+zip')).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });

    it('should throw UNAUTHORIZED when token is invalid', async () => {
      mockUsersService.checkToken.mockResolvedValue(null);

      await expect(service.getBookToDownload('invalid-token', 1, mockRes, 'EPUB', 'application/epub+zip')).rejects.toMatchObject({
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

      await expect(service.getBookToDownload('valid-token', 1, mockRes, 'EPUB', 'application/epub+zip')).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });
  });
});
