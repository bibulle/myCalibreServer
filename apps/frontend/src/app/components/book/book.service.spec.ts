import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ApiReturn, Book, BookRating, User } from '@my-calibre-server/api-interfaces';
import { of, throwError } from 'rxjs';
import { BookService } from './book.service';

describe('BookService', () => {
  let service: BookService;
  let mockHttpClient: jest.Mocked<HttpClient>;

  const buildBook = (overrides: Partial<Book> = {}): Book =>
    ({
      book_id: 1,
      book_title: 'Some Book',
      book_sort: 'Some Book',
      book_has_cover: 'y',
      book_path: '/path',
      book_series_index: 1,
      author_id: [1],
      author_name: ['Author'],
      author_sort: ['Author'],
      tag_id: [1],
      tag_name: ['Tag'],
      lang_id: 1,
      lang_code: 'en',
      series_id: '1',
      rating: '5',
      series_name: 'Series',
      series_sort: 'Series',
      comment: 'comment',
      book_date: new Date('2020-01-01'),
      timestamp: new Date('2020-01-01'),
      last_modified: new Date('2020-01-01'),
      data: [],
      history: { ratings: [], downloads: [] },
      readerRating: 0,
      readerRatingCount: 0,
      ...overrides,
    }) as Book;

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [BookService, { provide: HttpClient, useValue: mockHttpClient }],
    });

    service = TestBed.inject(BookService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getBooks', () => {
    it('should resolve with books and convert string book_date to Date', async () => {
      const book = buildBook({ book_date: '2020-05-01' as unknown as Date });
      mockHttpClient.get.mockReturnValue(of({ books: [book] } as ApiReturn));

      const result = await service.getBooks();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/book');
      expect(result[0].book_date).toBeInstanceOf(Date);
    });

    it('should reject when response has no books', async () => {
      mockHttpClient.get.mockReturnValue(of({} as ApiReturn));

      await expect(service.getBooks()).rejects.toEqual('Cannot read books');
    });

    it('should reject when the request errors', async () => {
      mockHttpClient.get.mockReturnValue(throwError(() => 'network error'));

      await expect(service.getBooks()).rejects.toEqual('network error');
    });
  });

  describe('getNewBooks', () => {
    it('should resolve with new books and convert string book_date to Date', async () => {
      const book = buildBook({ book_date: '2020-05-01' as unknown as Date });
      mockHttpClient.get.mockReturnValue(of({ books: [book] } as ApiReturn));

      const result = await service.getNewBooks();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/book/new');
      expect(result[0].book_date).toBeInstanceOf(Date);
    });

    it('should reject when response has no books', async () => {
      mockHttpClient.get.mockReturnValue(of({} as ApiReturn));

      await expect(service.getNewBooks()).rejects.toEqual('Cannot read books');
    });

    it('should reject when the request errors', async () => {
      mockHttpClient.get.mockReturnValue(throwError(() => 'network error'));

      await expect(service.getNewBooks()).rejects.toEqual('network error');
    });
  });

  describe('getBook', () => {
    it('should resolve with the book and convert string book_date to Date', async () => {
      const book = buildBook({ book_date: '2020-05-01' as unknown as Date });
      mockHttpClient.get.mockReturnValue(of({ book } as ApiReturn));

      const result = await service.getBook('1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/book/1');
      expect(result.book_date).toBeInstanceOf(Date);
    });

    it('should reject when response has no book', async () => {
      mockHttpClient.get.mockReturnValue(of({} as ApiReturn));

      await expect(service.getBook('1')).rejects.toEqual('Cannot read book');
    });

    it('should reject when the request errors', async () => {
      mockHttpClient.get.mockReturnValue(throwError(() => 'network error'));

      await expect(service.getBook('1')).rejects.toEqual('network error');
    });
  });

  describe('cloneBook', () => {
    it('should deep-copy array fields so mutating the clone does not affect the source', () => {
      const src = buildBook();

      const clone = service.cloneBook(src);
      clone.author_id.push(99);
      clone.tag_id.push(99);

      expect(clone).not.toBe(src);
      expect(src.author_id).toEqual([1]);
      expect(src.tag_id).toEqual([1]);
      expect(clone.author_id).toEqual([1, 99]);
    });

    it('should default tag_id, tag_name and data to empty arrays when absent on the source', () => {
      const src = buildBook({ tag_id: undefined, tag_name: undefined, data: undefined });

      const clone = service.cloneBook(src);

      expect(clone.tag_id).toEqual([]);
      expect(clone.tag_name).toEqual([]);
      expect(clone.data).toEqual([]);
    });
  });

  describe('updateRating', () => {
    it('should resolve with ok on success', async () => {
      mockHttpClient.post.mockReturnValue(of({ ok: 'ok' } as ApiReturn));

      const result = await service.updateRating(1, 5);

      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
      const [url, body, options] = mockHttpClient.post.mock.calls[0];
      expect(url).toEqual('/api/book/1/rating/');
      expect(body).toEqual(JSON.stringify({ rating: 5 }));
      expect((options?.headers as HttpHeaders).get('Accept')).toEqual('application/json');
      expect((options?.headers as HttpHeaders).get('Content-Type')).toEqual('application/json');
      expect(result).toEqual('ok');
    });

    it('should reject when response has no ok field', async () => {
      mockHttpClient.post.mockReturnValue(of({} as ApiReturn));

      await expect(service.updateRating(1, 5)).rejects.toEqual('Cannot update rating');
    });

    it('should reject when the request errors', async () => {
      mockHttpClient.post.mockReturnValue(throwError(() => 'network error'));

      await expect(service.updateRating(1, 5)).rejects.toEqual('network error');
    });
  });

  describe('sendKindle', () => {
    it('should resolve on success', async () => {
      mockHttpClient.get.mockReturnValue(of({} as ApiReturn));

      await expect(service.sendKindle(1, 'a@b.com')).resolves.toBeUndefined();
      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/book/1/send/kindle?mail=a@b.com');
    });

    it('should reject when the request errors', async () => {
      mockHttpClient.get.mockReturnValue(throwError(() => 'network error'));

      await expect(service.sendKindle(1, 'a@b.com')).rejects.toEqual('network error');
    });
  });

  describe('getEpubUrl', () => {
    it('should resolve with a URL containing the token', async () => {
      mockHttpClient.get.mockReturnValue(of({ id_token: 'tok123' } as ApiReturn));

      const result = await service.getEpubUrl(1);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/book/1/epub/url');
      expect(result).toEqual('/api/book/1/epub?token=tok123');
    });

    it('should reject when response has no id_token', async () => {
      mockHttpClient.get.mockReturnValue(of({} as ApiReturn));

      await expect(service.getEpubUrl(1)).rejects.toEqual('Cannot get epub url');
    });

    it('should reject when the request errors', async () => {
      mockHttpClient.get.mockReturnValue(throwError(() => 'network error'));

      await expect(service.getEpubUrl(1)).rejects.toEqual('network error');
    });
  });

  describe('getMobiUrl', () => {
    it('should resolve with a URL containing the token', async () => {
      mockHttpClient.get.mockReturnValue(of({ id_token: 'tok123' } as ApiReturn));

      const result = await service.getMobiUrl(1);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/book/1/mobi/url');
      expect(result).toEqual('/api/book/1/mobi?token=tok123');
    });

    it('should reject when response has no id_token', async () => {
      mockHttpClient.get.mockReturnValue(of({} as ApiReturn));

      await expect(service.getMobiUrl(1)).rejects.toEqual('Cannot get mobi url');
    });

    it('should reject when the request errors', async () => {
      mockHttpClient.get.mockReturnValue(throwError(() => 'network error'));

      await expect(service.getMobiUrl(1)).rejects.toEqual('network error');
    });
  });

  describe('updateReaderRating', () => {
    const buildUser = (overrides: Partial<User> = {}): User =>
      ({
        id: 'user-1',
        history: { lastConnection: new Date(), downloadedBooks: [], ratings: [] },
        ...overrides,
      }) as User;

    it('should aggregate ratings from book history and flag the current user rating', () => {
      const book = buildBook({
        history: {
          ratings: [
            { user_id: 'user-1', rating: 4, date: new Date(), user_name: 'me' },
            { user_id: 'user-2', rating: 2, date: new Date(), user_name: 'other' },
          ],
          downloads: [],
        },
      });
      const user = buildUser();

      const result = service.updateReaderRating(book, user);

      expect(result.count).toBe(2);
      expect(result.yourRating).toBe(4);
      expect(result.rating).toBe(3);
    });

    it('should not fail when the user has no ratings history', () => {
      const book = buildBook({
        history: { ratings: [{ user_id: 'user-2', rating: 4, date: new Date(), user_name: 'other' }], downloads: [] },
      });
      const user = buildUser({ history: { lastConnection: new Date(), downloadedBooks: [], ratings: undefined as unknown as BookRating[] } });

      const result = service.updateReaderRating(book, user);

      expect(result.count).toBe(1);
      expect(result.yourRating).toBe(0);
      expect(result.rating).toBe(4);
    });

    it('should default to a 0 rating when there are no ratings at all', () => {
      const book = buildBook({ history: { ratings: [], downloads: [] } });
      const user = buildUser();

      const result = service.updateReaderRating(book, user);

      expect(result.count).toBe(0);
      expect(result.rating).toBe(0);
    });

    it("should replace the book history rating with the user's own history rating for the same book", () => {
      const book = buildBook({
        book_id: 42,
        history: {
          ratings: [{ user_id: 'user-1', rating: 2, date: new Date(), user_name: 'me' }],
          downloads: [],
        },
      });
      const user = buildUser({
        history: {
          lastConnection: new Date(),
          downloadedBooks: [],
          ratings: [{ book_id: 42, rating: 5, date: new Date(), book_name: 'Some Book' }],
        },
      });

      const result = service.updateReaderRating(book, user);

      expect(result.count).toBe(1);
      expect(result.yourRating).toBe(5);
      expect(result.rating).toBe(5);
    });

    it('should ignore user history ratings for a different book', () => {
      const book = buildBook({
        book_id: 42,
        history: { ratings: [{ user_id: 'user-2', rating: 3, date: new Date(), user_name: 'other' }], downloads: [] },
      });
      const user = buildUser({
        history: {
          lastConnection: new Date(),
          downloadedBooks: [],
          ratings: [{ book_id: 99, rating: 5, date: new Date(), book_name: 'Other Book' }],
        },
      });

      const result = service.updateReaderRating(book, user);

      expect(result.count).toBe(1);
      expect(result.yourRating).toBe(0);
      expect(result.rating).toBe(3);
    });

    it('should decrement the count without resetting yourRating when the matching entry has a falsy rating', () => {
      const book = buildBook({
        book_id: 42,
        history: {
          ratings: [{ user_id: 'user-1', rating: 4, date: new Date(), user_name: 'me' }],
          downloads: [],
        },
      });
      const user = buildUser({
        history: {
          lastConnection: new Date(),
          downloadedBooks: [],
          ratings: [{ book_id: 42, rating: 0, date: new Date(), book_name: 'Some Book' }],
        },
      });

      const result = service.updateReaderRating(book, user);

      // the falsy new rating removes the previous contribution from the sum/count,
      // but the implementation does not reset yourRating in that case
      expect(result.count).toBe(0);
      expect(result.yourRating).toBe(4);
      expect(result.rating).toBe(0);
    });
  });
});
