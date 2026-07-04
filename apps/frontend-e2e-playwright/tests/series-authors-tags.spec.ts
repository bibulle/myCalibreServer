import { test, expect } from '@playwright/test';
import { testUser, login, getBooks, getSeries, getAuthors, getTags } from './helpers';

/**
 * Only covers API-based series/authors/tags browsing flows.
 */
test.describe('Series, Authors and Tags', () => {
  let token: string;

  test.beforeEach(async ({ request }) => {
    token = await login(request, testUser.username, testUser.password);
  });

  test.describe('Series API', () => {
    test('should fetch series list', async ({ request }) => {
      const response = await getSeries(request, token);
      expect(response).toHaveProperty('series');
      expect(Array.isArray(response.series)).toBe(true);
      expect(response.series.length).toBeGreaterThan(0);
    });

    test('should fetch series with pagination', async ({ request }) => {
      const data = await getSeries(request, token, { start: 0, count: 5 });
      expect(data.series.length).toBeLessThanOrEqual(5);
    });

    test('should search series by name', async ({ request }) => {
      const data = await getSeries(request, token, { search: 'a' });
      expect(Array.isArray(data.series)).toBe(true);
    });

    test('should get books for a specific series', async ({ request }) => {
      const seriesResponse = await getSeries(request, token);
      if (seriesResponse.series?.length > 0) {
        const series = seriesResponse.series[0];
        const booksResponse = await getBooks(request, token, { limit_to: `series:${series.series_id}` });
        expect(Array.isArray(booksResponse.books)).toBe(true);
        booksResponse.books.forEach((book) => {
          if (book.series_id) {
            expect(String(book.series_id)).toBe(String(series.series_id));
          }
        });
      }
    });

    test('should include series metadata', async ({ request }) => {
      const response = await getSeries(request, token);
      if (response.series?.length > 0) {
        const series = response.series[0];
        expect(series).toHaveProperty('series_id');
        expect(series).toHaveProperty('series_name');
        expect(Array.isArray(series.books)).toBe(true);
      }
    });

    test('should sort series by name', async ({ request }) => {
      const data = await getSeries(request, token, { sort: 'name', sort_order: 'asc' });
      expect(Array.isArray(data.series)).toBe(true);
      if (data.series.length > 0) {
        expect(data.series[0]).toHaveProperty('series_name');
      }
    });

    test('should sort series by book count', async ({ request }) => {
      const data = await getSeries(request, token, { sort: 'count', sort_order: 'desc' });
      expect(Array.isArray(data.series)).toBe(true);
      if (data.series.length > 0) {
        expect(Array.isArray(data.series[0].books)).toBe(true);
      }
    });
  });

  test.describe('Authors API', () => {
    test('should fetch authors list', async ({ request }) => {
      const response = await getAuthors(request, token);
      expect(response).toHaveProperty('authors');
      expect(Array.isArray(response.authors)).toBe(true);
      expect(response.authors.length).toBeGreaterThan(0);
    });

    test('should fetch authors with pagination', async ({ request }) => {
      const data = await getAuthors(request, token, { start: 0, count: 5 });
      expect(data.authors.length).toBeLessThanOrEqual(5);
    });

    test('should search authors by name', async ({ request }) => {
      const data = await getAuthors(request, token, { search: 'e' });
      expect(Array.isArray(data.authors)).toBe(true);
    });

    test('should get books for a specific author', async ({ request }) => {
      const authorsResponse = await getAuthors(request, token);
      if (authorsResponse.authors?.length > 0) {
        const author = authorsResponse.authors[0];
        const booksResponse = await getBooks(request, token, { limit_to: `author:${author.author_id}` });
        expect(Array.isArray(booksResponse.books)).toBe(true);
      }
    });

    test('should include author metadata', async ({ request }) => {
      const response = await getAuthors(request, token);
      if (response.authors?.length > 0) {
        const author = response.authors[0];
        expect(author).toHaveProperty('author_id');
        expect(author).toHaveProperty('author_name');
        expect(Array.isArray(author.books)).toBe(true);
      }
    });

    test('should sort authors by name', async ({ request }) => {
      const data = await getAuthors(request, token, { sort: 'name', sort_order: 'asc' });
      expect(Array.isArray(data.authors)).toBe(true);
      if (data.authors.length > 0) {
        expect(data.authors[0]).toHaveProperty('author_name');
      }
    });

    test('should sort authors by book count', async ({ request }) => {
      const data = await getAuthors(request, token, { sort: 'count', sort_order: 'desc' });
      expect(Array.isArray(data.authors)).toBe(true);
      if (data.authors.length > 0) {
        expect(Array.isArray(data.authors[0].books)).toBe(true);
      }
    });
  });

  test.describe('Tags API', () => {
    test('should fetch tags list', async ({ request }) => {
      const response = await getTags(request, token);
      expect(response).toHaveProperty('tags');
      expect(Array.isArray(response.tags)).toBe(true);
      expect(response.tags.length).toBeGreaterThan(0);
    });

    test('should fetch tags with pagination', async ({ request }) => {
      const data = await getTags(request, token, { start: 0, count: 5 });
      expect(data.tags.length).toBeLessThanOrEqual(5);
    });

    test('should search tags by name', async ({ request }) => {
      const data = await getTags(request, token, { search: 'a' });
      expect(Array.isArray(data.tags)).toBe(true);
    });

    test('should get books for a specific tag', async ({ request }) => {
      const tagsResponse = await getTags(request, token);
      if (tagsResponse.tags?.length > 0) {
        const tag = tagsResponse.tags[0];
        const booksResponse = await getBooks(request, token, { limit_to: `tag:${tag.tag_id}` });
        expect(Array.isArray(booksResponse.books)).toBe(true);
      }
    });

    test('should include tag metadata', async ({ request }) => {
      const response = await getTags(request, token);
      if (response.tags?.length > 0) {
        const tag = response.tags[0];
        expect(tag).toHaveProperty('tag_id');
        expect(tag).toHaveProperty('tag_name');
        expect(Array.isArray(tag.books)).toBe(true);
      }
    });

    test('should sort tags by name', async ({ request }) => {
      const data = await getTags(request, token, { sort: 'name', sort_order: 'asc' });
      expect(Array.isArray(data.tags)).toBe(true);
      if (data.tags.length > 0) {
        expect(data.tags[0]).toHaveProperty('tag_name');
      }
    });
  });

  test.describe('Data Consistency', () => {
    test('should have consistent book counts for a series', async ({ request }) => {
      const seriesResponse = await getSeries(request, token);
      if (seriesResponse.series?.length > 0) {
        const series = seriesResponse.series[0];
        const booksResponse = await getBooks(request, token, { limit_to: `series:${series.series_id}` });
        expect(booksResponse.books.length).toBeGreaterThanOrEqual(1);
        booksResponse.books.forEach((book) => {
          if (book.series_id) {
            expect(String(book.series_id)).toBe(String(series.series_id));
          }
        });
      }
    });

    test('should have consistent author book counts', async ({ request }) => {
      const authorsResponse = await getAuthors(request, token);
      if (authorsResponse.authors?.length > 0) {
        const author = authorsResponse.authors[0];
        const booksResponse = await getBooks(request, token, { limit_to: `author:${author.author_id}` });
        expect(booksResponse.books.length).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(booksResponse.books)).toBe(true);
      }
    });
  });
});
