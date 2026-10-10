import { Test, TestingModule } from '@nestjs/testing';
import { CalibreDb1Service } from './calibre-db1.service';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { User } from '@my-calibre-server/api-interfaces';

// Mock BooksService to avoid a circular dependency (books.service.ts -> series.service.ts ->
// calibre-db1.service.ts -> books.service.ts). `jest.requireActual` can't be used here since it
// re-enters that same cycle. This mock replicates just enough of the real static row-mapping
// (splitting pipe-delimited SQL fields into arrays, parsing dates) for getAllSeries/Authors/Tags
// to exercise their real grouping/sorting logic against realistic Book shapes.
jest.mock('../books/books.service', () => ({
  BooksService: {
    createBook: (row: any) => {
      const split = (name: string) => (row[name] && String(row[name]).length > 0 ? String(row[name]).split('|') : []);
      const book = { ...row };
      ['data_id', 'author_id', 'author_name', 'author_sort', 'tag_id', 'tag_name'].forEach((name) => {
        book[name] = split(name);
      });
      ['book_date', 'timestamp', 'last_modified'].forEach((name) => {
        book[name] = new Date(book[name]);
      });
      book.data = split('data_id').map((id: string, i: number) => ({
        data_id: id,
        data_format: split('data_format')[i],
        data_size: split('data_size')[i],
        data_name: split('data_name')[i],
      }));
      delete book['data_format'];
      delete book['data_size'];
      delete book['data_name'];
      book.history = { ratings: [], downloads: [] };
      return book;
    },
  },
}));

describe('CalibreDb1Service', () => {
  let service: CalibreDb1Service;
  let configService: ConfigService;

  // Path to the test database at project root
  const testDbPath = path.resolve(__dirname, '../../../../../test/data/calibre');

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'PATH_BOOKS') {
        return testDbPath;
      }
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalibreDb1Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CalibreDb1Service>(CalibreDb1Service);
    configService = module.get<ConfigService>(ConfigService);

    // Wait for database to be ready
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Database initialization', () => {
    it('should initialize CALIBRE_DIR from config', () => {
      expect(CalibreDb1Service.CALIBRE_DIR).toBe(testDbPath);
    });

    it('should have called config service for PATH_BOOKS', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('PATH_BOOKS');
    });
  });

  describe('getDbDate', () => {
    it('should return database file modification date', async () => {
      const result = await service.getDbDate();

      expect(result).toBeDefined();
      // Just verify it returns something date-like
      expect(result.getTime).toBeDefined();
    });

    it('should reject when the database file cannot be stat-ed', async () => {
      const originalDbFile = CalibreDb1Service['DB_FILE'];
      CalibreDb1Service['DB_FILE'] = '/does/not/exist/metadata.db';

      await expect(service.getDbDate()).rejects.toBeDefined();

      CalibreDb1Service['DB_FILE'] = originalDbFile;
    });
  });

  describe('getBooks', () => {
    it('should return a list of books from test database', async () => {
      const result = await service.getBooks();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return books with expected structure', async () => {
      const result = await service.getBooks();

      expect(result[0]).toHaveProperty('book_id');
      expect(result[0]).toHaveProperty('book_title');
    });

    it('should return exactly 16 books from test database', async () => {
      const result = await service.getBooks();

      expect(result.length).toBe(16);
    });

    it('should handle limit parameter', async () => {
      const result = await service.getBooks(1);

      expect(result).toBeDefined();
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('should handle offset parameter', async () => {
      const allBooks = await service.getBooks();
      const offsetBooks = await service.getBooks(1000000, 1);

      expect(offsetBooks.length).toBe(allBooks.length - 1);
    });

    it('should filter by book id', async () => {
      const result = await service.getBooks(undefined, undefined, 2);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      if (result.length > 0) {
        expect(result[0].book_id).toBe(2);
      }
    });

    it('should reject when the underlying query fails', async () => {
      jest.spyOn(service['_db'], 'all').mockImplementation(((query: string, cb: (err: unknown, rows?: unknown) => void) => cb(new Error('sql error'))) as any);

      await expect(service.getBooks()).rejects.toThrow('sql error');
    });
  });

  describe('getBooksCount', () => {
    it('should return the count of books', async () => {
      const result = await service.getBooksCount();

      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
      expect(result).toBe(16);
    });

    it('should return a positive number', async () => {
      const result = await service.getBooksCount();

      expect(result).toBeGreaterThan(0);
    });

    it('should reject when the underlying query fails', async () => {
      jest.spyOn(service['_db'], 'all').mockImplementation(((query: string, cb: (err: unknown, rows?: unknown) => void) => cb(new Error('sql error'))) as any);

      await expect(service.getBooksCount()).rejects.toThrow('sql error');
    });
  });

  describe('getBookPaths', () => {
    it('should return book paths', async () => {
      const result = await service.getBookPaths(2);

      expect(result).toBeDefined();
      expect(result.book_path).toBeDefined();
    });

    it('should reject when the underlying query fails', async () => {
      jest.spyOn(service['_db'], 'get').mockImplementation(((query: string, cb: (err: unknown, row?: unknown) => void) => cb(new Error('sql error'))) as any);

      await expect(service.getBookPaths(2)).rejects.toThrow('sql error');
    });
  });

  describe('getBook', () => {
    it('should return a single book with full details', async () => {
      const result = await service.getBook(2, Promise.resolve([]));

      expect(result).toBeDefined();
      expect(result.book_id).toBe(2);
      expect(result.book_title).toBeDefined();
    });

    it('should reject when the book id does not exist', async () => {
      await expect(service.getBook(999999, Promise.resolve([]))).rejects.toEqual('Not found');
    });

    it('should propagate errors from getBooks', async () => {
      jest.spyOn(service, 'getBooks').mockRejectedValue(new Error('db down'));

      await expect(service.getBook(2, Promise.resolve([]))).rejects.toThrow('db down');
    });
  });

  describe('getAllSeries', () => {
    it('should group books by series, sorted by series index', async () => {
      const result = await service.getAllSeries();

      expect(Array.isArray(result)).toBe(true);
      for (const series of result) {
        expect(series.books.length).toBeGreaterThan(0);
        const indices = series.books.map((b) => b.book_series_index);
        expect(indices).toEqual([...indices].sort((a, b) => a - b));
      }
    });

    it('should deduplicate author names/sorts and publication years within a series', async () => {
      const result = await service.getAllSeries();
      const seriesWithBooks = result.find((s) => s.books.length > 0);

      if (seriesWithBooks) {
        expect(new Set(seriesWithBooks.author_name).size).toBe(seriesWithBooks.author_name.length);
        expect(new Set(seriesWithBooks.book_date.map((d) => d.getFullYear())).size).toBe(seriesWithBooks.book_date.length);
      }
    });

    it('should propagate errors from getBooks', async () => {
      jest.spyOn(service, 'getBooks').mockRejectedValue(new Error('db down'));

      await expect(service.getAllSeries()).rejects.toThrow('db down');
    });
  });

  describe('getAllAuthors', () => {
    it('should group books by author', async () => {
      const result = await service.getAllAuthors();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      for (const author of result) {
        expect(author.books.length).toBeGreaterThan(0);
      }
    });

    it('should sort each author books by series (then index), then title', async () => {
      const result = await service.getAllAuthors();
      const authorWithMultipleBooks = result.find((a) => a.books.length > 1);

      if (authorWithMultipleBooks) {
        const sortKey = (b: (typeof authorWithMultipleBooks.books)[number]) =>
          (b.series_sort == null ? '' : b.series_sort + ' ') + (b.series_name == null ? '' : (b.book_series_index + '').padStart(6, '0') + ' ') + b.book_sort;
        const keys = authorWithMultipleBooks.books.map(sortKey);
        expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)));
      }
    });

    it('should propagate errors from getBooks', async () => {
      jest.spyOn(service, 'getBooks').mockRejectedValue(new Error('db down'));

      await expect(service.getAllAuthors()).rejects.toThrow('db down');
    });
  });

  describe('getAllTags', () => {
    it('should group books by tag', async () => {
      const result = await service.getAllTags();

      expect(Array.isArray(result)).toBe(true);
      for (const tag of result) {
        expect(tag.books.length).toBeGreaterThan(0);
      }
    });

    it('should propagate errors from getBooks', async () => {
      jest.spyOn(service, 'getBooks').mockRejectedValue(new Error('db down'));

      await expect(service.getAllTags()).rejects.toThrow('db down');
    });
  });

  describe('_makeWhere', () => {
    it('should create WHERE clause without locator', () => {
      const result = service._makeWhere('books');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should create WHERE clause with locator', () => {
      const result = service._makeWhere('books', 'test', 'title');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toContain('LIKE');
    });

    it('should handle numeric locator as ID', () => {
      const result = service._makeWhere('books', '123', 'id');

      expect(result).toBeDefined();
      expect(result[0]).toContain('books.id');
      // The service might convert to string, accept either format
      expect([123, '123']).toContain(result[1]);
    });
  });

  describe('fillBooksFromUser', () => {
    it('should fill books with empty user data', async () => {
      const books = await service.getBooks(2);

      const result = await service.fillBooksFromUser(books, Promise.resolve([]), false);

      expect(result).toBeDefined();
      expect(result.length).toBe(books.length);
    });

    it('should maintain book structure', async () => {
      const books = await service.getBooks(1);

      const result = await service.fillBooksFromUser(books, Promise.resolve([]), false);

      expect(result[0]).toHaveProperty('book_id');
      expect(result[0]).toHaveProperty('book_title');
    });

    it('should attach downloads and ratings from user history to the matching book', async () => {
      const [book] = await service.getBooks(1);
      const downloadDate = new Date(book.last_modified.getTime() + 1000 * 3600 * 24 * 365);
      const user = {
        id: 'u1',
        local: { username: 'alice', firstname: '', lastname: '' },
        history: {
          downloadedBooks: [{ id: book.book_id, date: downloadDate, data: { data_format: 'EPUB' } }],
          ratings: [{ book_id: book.book_id, rating: 4, date: downloadDate }],
        },
      } as unknown as User;

      const [result] = (await service.fillBooksFromUser([book], Promise.resolve([user]), false)) as any[];

      expect(result.history.downloads).toHaveLength(1);
      expect(result.history.downloads[0].user_name).toBe('alice');
      expect(result.history.ratings).toHaveLength(1);
      expect(result.readerRating).toBe(4);
      expect(result.readerRatingCount).toBe(1);
      expect(result.last_modified).toEqual(downloadDate);
    });

    it('should prefer first/last name over username when both are available', async () => {
      const [book] = await service.getBooks(1);
      const user = {
        id: 'u1',
        local: { username: 'alice', firstname: 'Alice', lastname: 'Doe' },
        history: { downloadedBooks: [{ id: book.book_id, date: new Date(0), data: { data_format: 'EPUB' } }], ratings: [] },
      } as unknown as User;

      const [result] = (await service.fillBooksFromUser([book], Promise.resolve([user]), false)) as any[];

      expect(result.history.downloads[0].user_name).toBe('Alice Doe');
    });

    it('should strip internal fields when cleanBook is true', async () => {
      const [book] = await service.getBooks(1);

      const [result] = (await service.fillBooksFromUser([book], Promise.resolve([]), true)) as any[];

      expect(result['book_path']).toBeUndefined();
      expect(result['tag_id']).toBeUndefined();
      expect(result['data']).toBeUndefined();
    });

    it('should reach into nested books arrays (e.g. series/tags) to apply user history', async () => {
      const books = await service.getBooks(2);
      const group = { books } as any;
      const user = {
        id: 'u1',
        local: { username: 'alice' },
        history: { downloadedBooks: [{ id: books[0].book_id, date: new Date(), data: { data_format: 'EPUB' } }], ratings: [] },
      } as unknown as User;

      // the top-level shape (grouped objects) is preserved; only the nested books get mutated
      const result = (await service.fillBooksFromUser([group], Promise.resolve([user]), false)) as any[];

      expect(result).toHaveLength(1);
      expect(result[0].books).toHaveLength(books.length);
      expect(result[0].books[0].history.downloads).toHaveLength(1);
    });

    it('should reject when the users promise rejects', async () => {
      await expect(service.fillBooksFromUser([], Promise.reject('user lookup failed'), false)).rejects.toEqual('user lookup failed');
    });
  });

  describe('SQL fragment helpers', () => {
    it('_concat should build a GROUP_CONCAT subquery joining through the expected link table', () => {
      const result = service['_concat']('author', 'book', 'name');

      expect(result).toContain('books_authors_link');
      expect(result).toContain('GROUP_CONCAT');
    });

    it('_concat_simple should build a distinct GROUP_CONCAT subquery by default', () => {
      const result = service['_concat_simple']('data', 'books', 'book', 'format');

      expect(result).toContain('SELECT DISTINCT');
      expect(result).toContain('data.format');
    });

    it('_concat_simple should allow disabling DISTINCT', () => {
      const result = service['_concat_simple']('data', 'books', 'book', 'name', false);

      expect(result).not.toContain('DISTINCT');
    });
  });
});
