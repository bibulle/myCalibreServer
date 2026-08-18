import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Book } from '@my-calibre-server/api-interfaces';
import { BookListComponent } from './book-list.component';
import { BookService } from '../book.service';
import { Filter, FilterService, LangAvailable } from '../../filter-bar/filter.service';
import { NotificationService } from '../../notification/notification.service';

describe('BookListComponent', () => {
  let component: BookListComponent;
  let mockBookService: jest.Mocked<BookService>;
  let mockFilterService: jest.Mocked<FilterService>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockTranslateService: jest.Mocked<TranslateService>;

  function makeBook(overrides: Partial<Book> = {}): Book {
    return { ...new Book(), book_id: 1, book_title: 'Clamser à Tataouine', book_sort: 'Clamser à Tataouine', author_name: ['Raymond Cousse'], ...overrides };
  }

  beforeEach(() => {
    mockBookService = {
      getBooks: jest.fn(() => Promise.resolve([makeBook()])),
      cloneBook: jest.fn((b: Book) => ({ ...b })),
    } as any;
    mockFilterService = {
      updateNotDisplayed: jest.fn(),
      updateLimitTo: jest.fn(),
      currentFilterObservable: jest.fn(() => of(new Filter())),
    } as any;
    mockNotificationService = { error: jest.fn() } as any;
    mockTranslateService = { instant: jest.fn((key, params) => `${key}:${JSON.stringify(params)}`) } as any;

    component = new BookListComponent(mockBookService, mockFilterService, mockNotificationService, mockTranslateService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('_filterAndSortBooks with a text search', () => {
    beforeEach(() => {
      component.fullBooks = [
        makeBook({ book_id: 1, book_title: 'Clamser à Tataouine', book_sort: 'Clamser à Tataouine', author_name: ['Raymond Cousse'] }),
        makeBook({ book_id: 2, book_title: 'Germinal', book_sort: 'Germinal', author_name: ['Émile Zola'] }),
      ];
      component.filter = new Filter();
    });

    it('should return every book when the search is empty', () => {
      component.filter.search = '';

      const result = component._filterAndSortBooks();

      expect(result.length).toBe(2);
    });

    it('should match the full title', () => {
      component.filter.search = 'clamser à tataouine';

      const result = component._filterAndSortBooks();

      expect(result.map((b) => b.book_title)).toEqual(['Clamser à Tataouine']);
    });

    it('should match every word independently of the order (issue #241)', () => {
      component.filter.search = 'clamser tataouine';

      const result = component._filterAndSortBooks();

      expect(result.map((b) => b.book_title)).toEqual(['Clamser à Tataouine']);
    });

    it('should match words spread across the title and the author name', () => {
      component.filter.search = 'germinal zola';

      const result = component._filterAndSortBooks();

      expect(result.map((b) => b.book_title)).toEqual(['Germinal']);
    });

    it('should be accent and case insensitive', () => {
      component.filter.search = 'TATAOUINE clamser';

      const result = component._filterAndSortBooks();

      expect(result.map((b) => b.book_title)).toEqual(['Clamser à Tataouine']);
    });

    it('should not match when one of the words belongs to another book', () => {
      component.filter.search = 'clamser germinal';

      const result = component._filterAndSortBooks();

      expect(result).toEqual([]);
      expect(component.totalBooksCount).toBe(0);
    });
  });

  describe('_filterAndSortBooks with a language filter', () => {
    it('should keep only the books of the selected language', () => {
      component.fullBooks = [makeBook({ book_id: 1, lang_code: 'fra' }), makeBook({ book_id: 2, lang_code: 'eng' })];
      component.filter = new Filter();
      component.filter.lang = LangAvailable.Fra;

      const result = component._filterAndSortBooks();

      expect(result.map((b) => b.book_id)).toEqual([1]);
    });
  });

  describe('isFiltering', () => {
    it('should not report filtering by default', () => {
      expect(component.isFiltering).toBe(false);
    });

    it('should report filtering when a search is set', () => {
      component.filter.search = 'tataouine';
      expect(component.isFiltering).toBe(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from the filter subscription', () => {
      component.ngOnInit();
      const unsubscribeSpy = jest.spyOn((component as any)._currentFilterSubscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });
});
