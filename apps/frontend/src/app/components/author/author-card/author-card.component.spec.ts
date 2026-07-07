import { Router } from '@angular/router';
import { Author } from '@my-calibre-server/api-interfaces';
import { AuthorCardComponent } from './author-card.component';

describe('AuthorCardComponent', () => {
  let component: AuthorCardComponent;
  let mockRouter: jest.Mocked<Router>;

  function makeAuthor(overrides: Partial<Author> = {}): Author {
    return { ...new Author(), author_id: 1, author_name: 'Isaac Asimov', book_date: [], books: [], ...overrides };
  }

  beforeEach(() => {
    mockRouter = { navigate: jest.fn() } as unknown as jest.Mocked<Router>;
    component = new AuthorCardComponent(mockRouter);
  });

  it('should be created with default inputs', () => {
    expect(component).toBeTruthy();
    expect(component.index).toBe(0);
    expect(component.booksClosed).toBe(true);
  });

  describe('toggleBooksClosed', () => {
    it('should flip the booksClosed flag', () => {
      component.booksClosed = true;
      component.toggleBooksClosed();
      expect(component.booksClosed).toBe(false);
    });
  });

  describe('avatarBg', () => {
    it('should cycle through the palette based on index', () => {
      component.index = 0;
      const first = component.avatarBg;
      component.index = 8;
      expect(component.avatarBg).toBe(first);
    });
  });

  describe('initials', () => {
    it('should return empty string when there is no author', () => {
      component.author = undefined;
      expect(component.initials).toBe('');
    });

    it('should build initials from the first and last name', () => {
      component.author = makeAuthor({ author_name: 'Isaac Asimov' });
      expect(component.initials).toBe('IA');
    });

    it('should handle a single-word name', () => {
      component.author = makeAuthor({ author_name: 'Voltaire' });
      expect(component.initials).toBe('VV');
    });
  });

  describe('yearsRange', () => {
    it('should return an empty string when there are no valid dates', () => {
      component.author = makeAuthor({ book_date: [] });
      expect(component.yearsRange).toBe('');
    });

    it('should return a single year when all dates share the same year', () => {
      component.author = makeAuthor({ book_date: [new Date('1998-01-01'), new Date('1998-06-01')] });
      expect(component.yearsRange).toBe('1998');
    });

    it('should return a min-max range when dates span multiple years', () => {
      component.author = makeAuthor({ book_date: [new Date('1998-01-01'), new Date('2014-06-01')] });
      expect(component.yearsRange).toBe('1998 – 2014');
    });

    it('should ignore pre-1850 placeholder dates', () => {
      component.author = makeAuthor({ book_date: [new Date('0100-01-01'), new Date('2005-01-01')] });
      expect(component.yearsRange).toBe('2005');
    });
  });

  describe('openBook', () => {
    it('should stop event propagation and navigate to the book page', () => {
      const event = { stopPropagation: jest.fn() } as unknown as Event;

      component.openBook(event, 7);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/book', 7]);
    });
  });
});
