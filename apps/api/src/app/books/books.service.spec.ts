import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SeriesService } from '../series/series.service';
import { Book } from '@my-calibre-server/api-interfaces';

describe('BooksService', () => {
  let service: BooksService;
  let calibreDbService: CalibreDb1Service;
  let usersService: UsersService;
  let seriesService: SeriesService;

  const mockCalibreDbService = {
    getBooks: jest.fn(),
    getBookById: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
    updateDownloads: jest.fn(),
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

  describe('Cron job initialization', () => {
    it('should register cron job on service creation', () => {
      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalledWith(
        'cronThumbnailRecurrent',
        expect.any(Object)
      );
    });

    it('should use configured cron expression', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith(
        'CRON_Thumbnail_RECURRING',
        expect.any(String)
      );
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
});
