import { Router } from '@angular/router';
import { Book } from '@my-calibre-server/api-interfaces';
import { HomeComponent, NewsGroupType } from './home.component';
import { BookService } from '../book/book.service';
import { Filter, FilterService } from '../filter-bar/filter.service';
import { NotificationService } from '../notification/notification.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let mockBookService: jest.Mocked<BookService>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockFilterService: jest.Mocked<FilterService>;
  let mockTranslateService: any;
  let mockRouter: jest.Mocked<Router>;

  function daysAgo(days: number): Date {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - days);
    return date;
  }

  function makeBook(id: number, timestamp: Date): Book {
    return {
      book_id: id,
      book_title: `Book ${id}`,
      author_name: [`Author ${id}`],
      tag_name: [],
      lang_code: 'eng',
      timestamp,
      book_date: new Date('1900-01-01'),
    } as Book;
  }

  beforeEach(() => {
    mockBookService = { getNewBooks: jest.fn() } as any;
    mockNotificationService = { error: jest.fn() } as any;
    mockFilterService = { update: jest.fn() } as any;
    mockTranslateService = { instant: jest.fn((key: string) => key) };
    mockRouter = { navigate: jest.fn() } as any;

    component = new HomeComponent(mockBookService, mockNotificationService, mockFilterService, mockTranslateService, mockRouter);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should hide the header filter and group the fetched books', async () => {
      mockBookService.getNewBooks.mockResolvedValue([makeBook(1, daysAgo(0))]);

      component.ngOnInit();
      await Promise.resolve();

      expect(mockFilterService.update).toHaveBeenCalledWith(expect.any(Filter));
      expect(component.groups.length).toBe(1);
      expect(component.groups[0].type).toBe(NewsGroupType.Today);
    });

    it('should notify an error when fetching fails', async () => {
      mockBookService.getNewBooks.mockReturnValue(Promise.reject('boom'));
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

      component.ngOnInit();
      await Promise.resolve();

      expect(mockNotificationService.error).toHaveBeenCalledWith('boom');
      logSpy.mockRestore();
    });
  });

  describe('grouping', () => {
    it('should bucket books into today, this week, this month, this year and earlier', async () => {
      mockBookService.getNewBooks.mockResolvedValue([
        makeBook(1, daysAgo(0)),
        makeBook(2, daysAgo(3)),
        makeBook(3, daysAgo(15)),
        makeBook(4, daysAgo(100)),
        makeBook(5, daysAgo(400)),
      ]);

      component.ngOnInit();
      await Promise.resolve();

      expect(component.groups.map(g => g.type)).toEqual([
        NewsGroupType.Today,
        NewsGroupType.ThisWeek,
        NewsGroupType.ThisMonth,
        NewsGroupType.ThisYear,
        NewsGroupType.Earlier,
      ]);
      expect(component.groups[0].books.map(b => b.book_id)).toEqual([1]);
      expect(component.groups[1].books.map(b => b.book_id)).toEqual([2]);
      expect(component.groups[2].books.map(b => b.book_id)).toEqual([3]);
      expect(component.groups[3].books.map(b => b.book_id)).toEqual([4]);
      expect(component.groups[4].books.map(b => b.book_id)).toEqual([5]);
    });

    it('should skip empty groups', async () => {
      mockBookService.getNewBooks.mockResolvedValue([makeBook(1, daysAgo(0))]);

      component.ngOnInit();
      await Promise.resolve();

      expect(component.groups.length).toBe(1);
    });
  });

  describe('daysSinceAdded', () => {
    it('should return 0 for a book added today', () => {
      expect(component.daysSinceAdded(makeBook(1, daysAgo(0)))).toBe(0);
    });

    it('should return 1 for a book added yesterday', () => {
      expect(component.daysSinceAdded(makeBook(1, daysAgo(1)))).toBe(1);
    });

    it('should return 6 for a book added six days ago', () => {
      expect(component.daysSinceAdded(makeBook(1, daysAgo(6)))).toBe(6);
    });
  });

  describe('addedDate', () => {
    it('should use the timestamp when it is a valid date', () => {
      const timestamp = daysAgo(2);
      const book = { timestamp, last_modified: daysAgo(10) } as Book;

      expect(component.addedDate(book)).toEqual(timestamp);
    });

    it('should fall back to last_modified when timestamp is missing', () => {
      const lastModified = daysAgo(5);
      const book = { timestamp: undefined, last_modified: lastModified } as unknown as Book;

      expect(component.addedDate(book)).toEqual(lastModified);
    });
  });

  describe('groupLabel', () => {
    it('should translate the Today group', () => {
      expect(component.groupLabel(NewsGroupType.Today)).toBe('label.news-today');
      expect(mockTranslateService.instant).toHaveBeenCalledWith('label.news-today');
    });

    it('should translate the ThisWeek group', () => {
      expect(component.groupLabel(NewsGroupType.ThisWeek)).toBe('label.news-this-week');
    });

    it('should translate the ThisMonth group', () => {
      expect(component.groupLabel(NewsGroupType.ThisMonth)).toBe('label.news-this-month');
    });

    it('should translate the ThisYear group', () => {
      expect(component.groupLabel(NewsGroupType.ThisYear)).toBe('label.news-this-year');
    });

    it('should translate the Earlier group', () => {
      expect(component.groupLabel(NewsGroupType.Earlier)).toBe('label.news-earlier');
    });
  });

  describe('openBook', () => {
    it('should navigate to the book page', () => {
      component.openBook(42);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/book', 42]);
    });
  });
});
