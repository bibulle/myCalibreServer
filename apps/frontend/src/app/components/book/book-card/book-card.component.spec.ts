import { Router } from '@angular/router';
import { Book } from '@my-calibre-server/api-interfaces';
import { BookCardComponent } from './book-card.component';

describe('BookCardComponent', () => {
  let component: BookCardComponent;
  let mockRouter: jest.Mocked<Router>;

  beforeEach(() => {
    mockRouter = { navigate: jest.fn() } as unknown as jest.Mocked<Router>;
    component = new BookCardComponent(mockRouter);
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
});
