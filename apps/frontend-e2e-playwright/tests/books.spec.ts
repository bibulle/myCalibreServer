import { test, expect } from '@playwright/test';
import { APIRequestContext } from '@playwright/test';
import { testUser, login, getBooks, getBook, getSeries, getAuthors, getTags, rateBook } from './helpers';

/**
 * Only covers API-based book browsing/search/rating flows.
 */
test.describe('Books', () => {
  let token: string;

  test.beforeEach(async ({ request }: { request: APIRequestContext }) => {
    token = await login(request, testUser.username, testUser.password);
  });

  test.describe('Books API', () => {
    test('should fetch books list', async ({ request }) => {
      const response = await getBooks(request, token);
      expect(response).toHaveProperty('books');
      expect(Array.isArray(response.books)).toBe(true);
      expect(response.books.length).toBeGreaterThan(0);
    });

    test('should fetch books with pagination', async ({ request }) => {
      const response = await getBooks(request, token, { start: 0, count: 10 });
      expect(response.books.length).toBeLessThanOrEqual(10);
    });

    test('should search books by title', async ({ request }) => {
      const response = await getBooks(request, token, { search: 'Test' });
      expect(Array.isArray(response.books)).toBe(true);
    });

    test('should filter books by series', async ({ request }) => {
      const seriesResponse = await getSeries(request, token);
      if (seriesResponse.series?.length > 0) {
        const seriesId = seriesResponse.series[0].series_id;
        const booksResponse = await getBooks(request, token, { limit_to: `series:${seriesId}` });
        expect(Array.isArray(booksResponse.books)).toBe(true);
        const hasSomeBooksInSeries = booksResponse.books.some((book) => String(book.series_id) === String(seriesId));
        expect(hasSomeBooksInSeries).toBe(true);
      }
    });

    test('should filter books by author', async ({ request }) => {
      const authorsResponse = await getAuthors(request, token);
      if (authorsResponse.authors?.length > 0) {
        const authorId = authorsResponse.authors[0].id;
        const booksResponse = await getBooks(request, token, { limit_to: `author:${authorId}` });
        expect(Array.isArray(booksResponse.books)).toBe(true);
      }
    });

    test('should filter books by tag', async ({ request }) => {
      const tagsResponse = await getTags(request, token);
      if (tagsResponse.tags?.length > 0) {
        const tagId = tagsResponse.tags[0].id;
        const booksResponse = await getBooks(request, token, { limit_to: `tag:${tagId}` });
        expect(Array.isArray(booksResponse.books)).toBe(true);
      }
    });

    test('should sort books by title', async ({ request }) => {
      const response = await getBooks(request, token, { sort: 'title', sort_order: 'asc' });
      expect(response.books.length).toBeGreaterThan(0);
    });

    test('should get a specific book by ID', async ({ request }) => {
      const response = await getBooks(request, token, { count: 1 });
      if (response.books?.length > 0) {
        const bookId = response.books[0].book_id;
        const bookResponse = await getBook(request, token, bookId);
        expect(bookResponse).toHaveProperty('book');
        expect(bookResponse.book).toHaveProperty('book_id', bookId);
        expect(bookResponse.book).toHaveProperty('book_title');
      }
    });
  });

  test.describe('Book Search', () => {
    test('should search for books via API', async ({ request }) => {
      const response = await getBooks(request, token, { search: 'sang' });
      expect(response).toHaveProperty('books');
      expect(Array.isArray(response.books)).toBe(true);
    });

    test('should return relevant results for search query', async ({ request }) => {
      const response = await getBooks(request, token, { search: 'Test' });
      if (response.books.length > 0) {
        expect(response.books[0]).toHaveProperty('book_title');
      }
    });

    test('should handle empty search results', async ({ request }) => {
      const response = await getBooks(request, token, { search: 'zzz_nonexistent_book_xyz_12345' });
      expect(Array.isArray(response.books)).toBe(true);
    });
  });

  test.describe('Book Details', () => {
    test('should fetch book details with all properties', async ({ request }) => {
      const response = await getBooks(request, token, { count: 1 });
      if (response.books?.length > 0) {
        const bookResponse = await getBook(request, token, response.books[0].book_id);
        expect(bookResponse.book).toHaveProperty('book_id');
        expect(bookResponse.book).toHaveProperty('book_title');
        expect(bookResponse.book).toHaveProperty('author_name');
        expect(Array.isArray(bookResponse.book.author_name)).toBe(true);
      }
    });

    test('should include book metadata', async ({ request }) => {
      const response = await getBooks(request, token, { count: 1 });
      if (response.books?.length > 0) {
        expect(response.books[0]).toHaveProperty('book_id');
        expect(response.books[0]).toHaveProperty('book_title');
      }
    });
  });

  test.describe('Book Ratings', () => {
    test('should rate a book when authenticated', async ({ request }) => {
      const response = await getBooks(request, token, { count: 1 });
      if (response.books?.length > 0) {
        const ratingResponse = await rateBook(request, token, response.books[0].book_id, 4);
        expect(ratingResponse).toHaveProperty('ok');
      }
    });

    test('should update book rating', async ({ request }) => {
      const response = await getBooks(request, token, { count: 1 });
      if (response.books?.length > 0) {
        const bookId = response.books[0].book_id;
        await rateBook(request, token, bookId, 3);
        const ratingResponse = await rateBook(request, token, bookId, 5);
        expect(ratingResponse).toHaveProperty('ok');
      }
    });

    test('should validate rating range (1-5)', async ({ request }) => {
      const response = await getBooks(request, token, { count: 1 });
      if (response.books?.length > 0) {
        const bookId = response.books[0].book_id;
        for (const rating of [1, 2, 3, 4, 5]) {
          const ratingResponse = await rateBook(request, token, bookId, rating);
          expect(ratingResponse).toBeTruthy();
        }
      }
    });
  });

  test.describe('Book Filters', () => {
    test('should filter by language', async ({ request }) => {
      const response = await getBooks(request, token, { lang: 'fra' });
      expect(Array.isArray(response.books)).toBe(true);
    });

    test('should combine multiple filters', async ({ request }) => {
      const seriesResponse = await getSeries(request, token);
      if (seriesResponse.series?.length > 0) {
        const seriesId = seriesResponse.series[0].series_id;
        const booksResponse = await getBooks(request, token, {
          limit_to: `series:${seriesId}`,
          sort: 'title',
          sort_order: 'asc',
        });
        expect(Array.isArray(booksResponse.books)).toBe(true);
      }
    });

    test('should handle filter with search', async ({ request }) => {
      const tagsResponse = await getTags(request, token);
      if (tagsResponse.tags?.length > 0) {
        const tagId = tagsResponse.tags[0].tag_id;
        const booksResponse = await getBooks(request, token, { limit_to: `tag:${tagId}`, search: 'Test' });
        expect(Array.isArray(booksResponse.books)).toBe(true);
      }
    });
  });

  test.describe('Books Pagination', () => {
    test('should paginate through books', async ({ request }) => {
      const pageSize = 10;
      const firstPage = await getBooks(request, token, { start: 0, count: pageSize });
      expect(firstPage.books.length).toBeLessThanOrEqual(pageSize);

      if (firstPage.count > pageSize) {
        const secondPage = await getBooks(request, token, { start: pageSize, count: pageSize });
        expect(secondPage.books.length).toBeLessThanOrEqual(pageSize);
        if (firstPage.books.length > 0 && secondPage.books.length > 0) {
          expect(firstPage.books[0].id).not.toBe(secondPage.books[0].id);
        }
      }
    });

    test('should respect count parameter', async ({ request }) => {
      const requestedCount = 5;
      const response = await getBooks(request, token, { count: requestedCount });
      expect(response.books.length).toBeLessThanOrEqual(requestedCount);
    });
  });

  test.describe('New Books', () => {
    test('should fetch new books', async ({ request }) => {
      const response = await request.get('http://localhost:3333/api/book/new', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('books');
      expect(Array.isArray(data.books)).toBe(true);
    });
  });
});
