import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Book, BookData, findBookFormat, User } from '@my-calibre-server/api-interfaces';
import { BookPageComponent } from './book-page.component';
import { BookService } from '../book.service';
import { FilterService } from '../../filter-bar/filter.service';
import { TitleService } from '../../../app/title.service';
import { NotificationService } from '../../notification/notification.service';
import { UserService } from '../../authent/user.service';

describe('BookPageComponent', () => {
  let component: BookPageComponent;
  let mockFilterService: jest.Mocked<FilterService>;
  let mockTitleService: jest.Mocked<TitleService>;
  let mockBookService: jest.Mocked<BookService>;
  let mockRoute: ActivatedRoute;
  let mockRouter: jest.Mocked<Router>;
  let mockDialog: jest.Mocked<MatDialog>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockUserService: jest.Mocked<UserService>;
  let mockTranslateService: jest.Mocked<TranslateService>;

  const mockUser = { id: 'user-1' } as User;

  function makeBook(overrides: Partial<Book> = {}): Book {
    return { ...new Book(), book_id: 42, book_title: 'Dune', data: [], ...overrides };
  }

  beforeEach(() => {
    mockFilterService = { updateNotDisplayed: jest.fn() } as any;
    mockTitleService = { goBack: jest.fn(), forceTitle: jest.fn() } as any;
    mockBookService = {
      getBook: jest.fn(() => Promise.resolve(makeBook())),
      updateReaderRating: jest.fn(() => ({ rating: 8, count: 3, yourRating: 4 })),
      updateRating: jest.fn(() => Promise.resolve('SAVED')),
      getDownloadUrl: jest.fn(() => Promise.resolve('http://example.com/book.file')),
      sendKindle: jest.fn(() => Promise.resolve()),
    } as any;
    mockRoute = { snapshot: { params: { id: '42' } } } as any;
    mockRouter = { navigate: jest.fn(), url: '/book/42' } as any;
    mockDialog = { open: jest.fn() } as any;
    mockNotificationService = { info: jest.fn(), error: jest.fn() } as any;
    mockUserService = { getUser: jest.fn(() => mockUser), refreshUser: jest.fn(() => Promise.resolve()) } as any;
    mockTranslateService = { instant: jest.fn((key) => key) } as any;

    component = new BookPageComponent(
      mockFilterService,
      mockTitleService,
      mockBookService,
      mockRoute,
      mockRouter,
      mockDialog,
      mockNotificationService,
      mockUserService,
      mockTranslateService
    );
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should hide the header filter and fetch the book by route id', async () => {
      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockFilterService.updateNotDisplayed).toHaveBeenCalledWith(true);
      expect(mockBookService.getBook).toHaveBeenCalledWith('42');
      expect(component.book.book_title).toBe('Dune');
    });

    it('should list the available formats best first', async () => {
      mockBookService.getBook.mockReturnValue(
        Promise.resolve(makeBook({ data: [{ data_format: 'MOBI' } as BookData, { data_format: 'PDF' } as BookData, { data_format: 'EPUB' } as BookData] }))
      );

      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();

      expect(component.availableFormats.map((f) => f.id)).toEqual(['EPUB', 'PDF', 'MOBI']);
    });

    it('should list the single format of a PDF-only book', async () => {
      mockBookService.getBook.mockReturnValue(Promise.resolve(makeBook({ data: [{ data_format: 'PDF' } as BookData] })));

      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();

      expect(component.availableFormats.map((f) => f.id)).toEqual(['PDF']);
      expect(component.kindleFormat?.id).toBe('PDF');
    });

    it('should leave the format list empty when the book has no data', async () => {
      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();

      expect(component.availableFormats).toEqual([]);
      expect(component.kindleFormat).toBeUndefined();
    });

    it('should offer no Kindle format for a MOBI-only book', async () => {
      mockBookService.getBook.mockReturnValue(Promise.resolve(makeBook({ data: [{ data_format: 'MOBI' } as BookData] })));

      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();

      expect(component.availableFormats.map((f) => f.id)).toEqual(['MOBI']);
      expect(component.kindleFormat).toBeUndefined();
    });

    it('should compute the reader ratings for the current user and force the title', async () => {
      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockBookService.updateReaderRating).toHaveBeenCalledWith(component.book, mockUser);
      expect(component.ratings.rating).toBe(8);
      expect(mockTitleService.forceTitle).toHaveBeenCalledWith('/book/42', 'Dune');
    });

    it('should notify an error when the book cannot be fetched', async () => {
      mockBookService.getBook.mockReturnValue(Promise.reject('boom'));

      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockNotificationService.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('goBack', () => {
    it('should delegate to TitleService', () => {
      component.goBack();
      expect(mockTitleService.goBack).toHaveBeenCalled();
    });
  });

  describe('ratingUpdated', () => {
    it('should save the rating (doubled to the 0-10 scale) and notify success', async () => {
      component.book = makeBook();

      component.ratingUpdated(4);

      expect(component.ratings.yourRating).toBe(8);
      expect(mockBookService.updateRating).toHaveBeenCalledWith(42, 8);

      await Promise.resolve();
      await Promise.resolve();

      expect(mockNotificationService.info).toHaveBeenCalledWith('label.rating.saved');
    });

    it('should notify an error when saving the rating fails', async () => {
      mockBookService.updateRating.mockReturnValue(Promise.reject('boom'));
      component.book = makeBook();

      component.ratingUpdated(3);
      await Promise.resolve();
      await Promise.resolve();

      expect(mockNotificationService.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('openAuthor / openTag / openSeries', () => {
    it('should stop propagation and navigate to the author page', () => {
      const event = { stopPropagation: jest.fn() } as unknown as Event;
      component.openAuthor(event, 7, 'Frank Herbert');

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/authors'], { queryParams: { id: 7, name: 'Frank Herbert' } });
    });

    it('should stop propagation and navigate to the tags page', () => {
      const event = { stopPropagation: jest.fn() } as unknown as Event;
      component.openTag(event, 3, 'Sci-Fi');

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tags'], { queryParams: { id: 3, name: 'Sci-Fi' } });
    });

    it('should stop propagation and navigate to the series page', () => {
      const event = { stopPropagation: jest.fn() } as unknown as Event;
      component.openSeries(event, 'series-1', 'Dune Saga');

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/series'], { queryParams: { id: 'series-1', name: 'Dune Saga' } });
    });
  });

  describe('download', () => {
    it.each(['EPUB', 'PDF', 'MOBI'])('should fetch the %s url and trigger a download', async (id) => {
      component.book = makeBook();

      component.download(findBookFormat(id));
      await Promise.resolve();
      await Promise.resolve();

      expect(mockBookService.getDownloadUrl).toHaveBeenCalledWith(42, expect.objectContaining({ id }));
    });

    it('should notify an error when the url cannot be fetched', async () => {
      mockBookService.getDownloadUrl.mockReturnValue(Promise.reject('boom'));
      component.book = makeBook();

      component.download(findBookFormat('EPUB'));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockNotificationService.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('openDialog', () => {
    it('should send the book to the returned kindle email', async () => {
      component.book = makeBook();
      mockDialog.open.mockReturnValue({ afterClosed: () => of({ mail: 'me@example.com' }) } as any);

      component.openDialog();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockBookService.sendKindle).toHaveBeenCalledWith(42, 'me@example.com');
    });

    it('should do nothing when the dialog is closed without an email', () => {
      component.book = makeBook();
      mockDialog.open.mockReturnValue({ afterClosed: () => of({ mail: undefined }) } as any);

      component.openDialog();

      expect(mockBookService.sendKindle).not.toHaveBeenCalled();
    });
  });
});
