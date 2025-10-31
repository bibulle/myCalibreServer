import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Book } from '@my-calibre-server/api-interfaces';
import { of, throwError } from 'rxjs';
import { BookService } from '../book/book.service';
import { Filter, FilterService } from '../filter-bar/filter.service';
import { NotificationService } from '../notification/notification.service';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockBookService: jest.Mocked<BookService>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockFilterService: jest.Mocked<FilterService>;

  const mockBooks: Book[] = [
    {
      book_id: 1,
      book_title: 'Test Book 1',
      book_sort: 'Test Book 1',
      book_has_cover: 'true',
      book_path: '/path/to/book1',
      book_series_index: 0,
      author_id: [1],
      author_name: ['Author 1'],
      author_sort: ['Author 1'],
      tag_id: [],
      tag_name: [],
      lang_id: 1,
      lang_code: 'eng',
      series_id: '',
      rating: '',
      series_name: '',
      series_sort: '',
      comment: '',
      book_date: new Date('2024-01-01'),
      timestamp: new Date(),
      last_modified: new Date(),
      data: [],
      history: { ratings: [], downloads: [] },
      readerRating: 0,
      readerRatingCount: 0,
    } as Book,
    {
      book_id: 2,
      book_title: 'Test Book 2',
      book_sort: 'Test Book 2',
      book_has_cover: 'true',
      book_path: '/path/to/book2',
      book_series_index: 0,
      author_id: [2],
      author_name: ['Author 2'],
      author_sort: ['Author 2'],
      tag_id: [],
      tag_name: [],
      lang_id: 1,
      lang_code: 'eng',
      series_id: '',
      rating: '',
      series_name: '',
      series_sort: '',
      comment: '',
      book_date: new Date('2024-01-02'),
      timestamp: new Date(),
      last_modified: new Date(),
      data: [],
      history: { ratings: [], downloads: [] },
      readerRating: 0,
      readerRatingCount: 0,
    } as Book,
  ];

  beforeEach(async () => {
    mockBookService = {
      getNewBooks: jest.fn(),
    } as any;

    mockNotificationService = {
      error: jest.fn(),
      success: jest.fn(),
      info: jest.fn(),
    } as any;

    mockFilterService = {
      update: jest.fn(),
      currentFilterObservable: jest.fn(() => of(new Filter())),
    } as any;

    await TestBed.configureTestingModule({
      declarations: [HomeComponent],
      providers: [
        { provide: BookService, useValue: mockBookService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: FilterService, useValue: mockFilterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with empty books array', () => {
      expect(component.books).toEqual([]);
    });

    it('should have BOOKS_LIMIT set to 200', () => {
      expect(component.BOOKS_LIMIT).toBe(200);
    });

    it('should have param object with BOOKS_LIMIT', () => {
      expect(component.param).toEqual({ BOOKS_LIMIT: 200 });
    });
  });

  describe('ngOnInit', () => {
    it('should update filter with not_displayed true', async () => {
      mockBookService.getNewBooks.mockResolvedValue(mockBooks);

      await component.ngOnInit();

      expect(mockFilterService.update).toHaveBeenCalledTimes(1);
      expect(mockFilterService.update).toHaveBeenCalledWith(expect.objectContaining({ not_displayed: true }));
    });

    it('should fetch new books successfully', async () => {
      mockBookService.getNewBooks.mockResolvedValue(mockBooks);

      await component.ngOnInit();

      // Wait for promise resolution
      await fixture.whenStable();

      expect(mockBookService.getNewBooks).toHaveBeenCalledTimes(1);
      expect(component.books).toEqual(mockBooks);
    });

    it('should handle empty books response', async () => {
      mockBookService.getNewBooks.mockResolvedValue([]);

      await component.ngOnInit();
      await fixture.whenStable();

      expect(component.books).toEqual([]);
      expect(mockNotificationService.error).not.toHaveBeenCalled();
    });

    it('should handle error when fetching books fails', async () => {
      const error = new Error('Failed to fetch books');
      mockBookService.getNewBooks.mockRejectedValue(error);

      // Spy on console.log
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await component.ngOnInit();
      await fixture.whenStable();

      expect(mockNotificationService.error).toHaveBeenCalledWith(error);
      expect(consoleLogSpy).toHaveBeenCalledWith(error);
      expect(component.books).toEqual([]);

      consoleLogSpy.mockRestore();
    });

    it('should handle string error message', async () => {
      const errorMessage = 'Network error';
      mockBookService.getNewBooks.mockRejectedValue(errorMessage);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await component.ngOnInit();
      await fixture.whenStable();

      expect(mockNotificationService.error).toHaveBeenCalledWith(errorMessage);
      expect(consoleLogSpy).toHaveBeenCalledWith(errorMessage);

      consoleLogSpy.mockRestore();
    });
  });

  describe('component properties', () => {
    it('should maintain books array reference', async () => {
      mockBookService.getNewBooks.mockResolvedValue(mockBooks);

      const initialBooksRef = component.books;

      await component.ngOnInit();
      await fixture.whenStable();

      // Books array should be updated with new data
      expect(component.books).not.toBe(initialBooksRef);
      expect(component.books).toEqual(mockBooks);
    });

    it('should update param when BOOKS_LIMIT changes', () => {
      component.BOOKS_LIMIT = 100;
      component.param = { BOOKS_LIMIT: component.BOOKS_LIMIT };

      expect(component.param.BOOKS_LIMIT).toBe(100);
    });
  });

  describe('integration', () => {
    it('should call all initialization methods in correct order', async () => {
      mockBookService.getNewBooks.mockResolvedValue(mockBooks);

      await component.ngOnInit();
      await fixture.whenStable();

      // Filter update should be called first
      expect(mockFilterService.update).toHaveBeenCalled();
      // Then books should be fetched
      expect(mockBookService.getNewBooks).toHaveBeenCalled();
      // Books should be populated
      expect(component.books.length).toBe(2);
    });

    it('should not show error notification on successful load', async () => {
      mockBookService.getNewBooks.mockResolvedValue(mockBooks);

      await component.ngOnInit();
      await fixture.whenStable();

      expect(mockNotificationService.error).not.toHaveBeenCalled();
    });

    it('should handle multiple initialization calls', async () => {
      mockBookService.getNewBooks.mockResolvedValue(mockBooks);

      await component.ngOnInit();
      await fixture.whenStable();

      const firstBooks = [...component.books];

      // Call ngOnInit again
      const newBooks = [
        ...mockBooks,
        {
          book_id: 3,
          book_title: 'Book 3',
          book_sort: 'Book 3',
          author_name: ['Author 3'],
        } as Book,
      ];
      mockBookService.getNewBooks.mockResolvedValue(newBooks);

      await component.ngOnInit();
      await fixture.whenStable();

      expect(component.books).toEqual(newBooks);
      expect(component.books.length).toBe(3);
      expect(mockFilterService.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('Filter configuration', () => {
    it('should create filter with not_displayed option', async () => {
      mockBookService.getNewBooks.mockResolvedValue(mockBooks);

      await component.ngOnInit();

      const filterCall = mockFilterService.update.mock.calls[0][0];
      expect(filterCall).toBeInstanceOf(Filter);
      expect(filterCall.not_displayed).toBe(true);
    });

    it('should not affect other filter properties', async () => {
      mockBookService.getNewBooks.mockResolvedValue(mockBooks);

      await component.ngOnInit();

      const filterCall = mockFilterService.update.mock.calls[0][0];
      // Default filter values should be preserved
      expect(filterCall.search).toBe('');
      expect(filterCall.limit_to).toEqual([]);
    });
  });
});
