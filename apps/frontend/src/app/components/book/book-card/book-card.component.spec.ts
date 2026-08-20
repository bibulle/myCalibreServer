import { Router } from '@angular/router';
import { Book, BookData } from '@my-calibre-server/api-interfaces';
import { BookCardComponent } from './book-card.component';
import { BookService } from '../book.service';
import { UserService } from '../../authent/user.service';
import { NotificationService } from '../../notification/notification.service';

describe('BookCardComponent', () => {
  let component: BookCardComponent;
  let mockRouter: jest.Mocked<Router>;
  let mockBookService: jest.Mocked<BookService>;
  let mockUserService: jest.Mocked<UserService>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    mockRouter = { navigate: jest.fn() } as unknown as jest.Mocked<Router>;
    mockBookService = {
      getDownloadUrl: jest.fn(() => Promise.resolve('http://example.com/book.file')),
    } as any;
    mockUserService = {
      refreshUser: jest.fn(() => Promise.resolve()),
    } as any;
    mockNotificationService = {
      error: jest.fn(),
    } as any;

    component = new BookCardComponent(mockRouter, mockBookService, mockUserService, mockNotificationService);
  });

  it('should be created with default inputs', () => {
    expect(component).toBeTruthy();
    expect(component.book).toBeInstanceOf(Book);
    expect(component.book.book_id).toBe(0);
    expect(component.index).toBe(-1);
    expect(component.thumbnailUrlBase).toBe('/api/book/thumbnail');
  });

  describe('openBook', () => {
    it('should stop event propagation and navigate to the book page', () => {
      const event = { stopPropagation: jest.fn() } as unknown as Event;
      component.book = { ...new Book(), book_id: 42 };

      component.openBook(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/book', 42]);
    });
  });

  describe('downloadFormat', () => {
    it('should be undefined when the book has no data', () => {
      component.book = { ...new Book(), data: [] };
      expect(component.downloadFormat).toBeUndefined();
    });

    it('should be undefined when no format is servable', () => {
      component.book = { ...new Book(), data: [{ data_format: 'DJVU' } as BookData] };
      expect(component.downloadFormat).toBeUndefined();
    });

    it('should prefer EPUB when several formats are available', () => {
      component.book = { ...new Book(), data: [{ data_format: 'MOBI' } as BookData, { data_format: 'PDF' } as BookData, { data_format: 'EPUB' } as BookData] };
      expect(component.downloadFormat?.id).toBe('EPUB');
    });

    it('should fall back to the PDF of a PDF-only book', () => {
      component.book = { ...new Book(), data: [{ data_format: 'PDF' } as BookData] };
      expect(component.downloadFormat?.id).toBe('PDF');
    });
  });

  describe('download', () => {
    it('should stop propagation and download the epub when available', async () => {
      const event = { stopPropagation: jest.fn() } as unknown as Event;
      component.book = { ...new Book(), book_id: 7, data: [{ data_format: 'EPUB' } as BookData] };

      component.download(event);
      await Promise.resolve();
      await Promise.resolve();

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(mockBookService.getDownloadUrl).toHaveBeenCalledWith(7, expect.objectContaining({ id: 'EPUB' }));
    });

    it('should download the PDF of a PDF-only book', async () => {
      const event = { stopPropagation: jest.fn() } as unknown as Event;
      component.book = { ...new Book(), book_id: 8, data: [{ data_format: 'PDF' } as BookData] };

      component.download(event);
      await Promise.resolve();
      await Promise.resolve();

      expect(mockBookService.getDownloadUrl).toHaveBeenCalledWith(8, expect.objectContaining({ id: 'PDF' }));
    });

    it('should do nothing when the book has no servable format', async () => {
      const event = { stopPropagation: jest.fn() } as unknown as Event;
      component.book = { ...new Book(), book_id: 10, data: [] };

      component.download(event);
      await Promise.resolve();

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(mockBookService.getDownloadUrl).not.toHaveBeenCalled();
    });

    it('should notify an error when the download URL cannot be fetched', async () => {
      mockBookService.getDownloadUrl.mockReturnValue(Promise.reject('boom'));
      const event = { stopPropagation: jest.fn() } as unknown as Event;
      component.book = { ...new Book(), book_id: 9, data: [{ data_format: 'EPUB' } as BookData] };

      component.download(event);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockNotificationService.error).toHaveBeenCalledWith('boom');
    });
  });
});
