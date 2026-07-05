import { Router } from '@angular/router';
import { Series } from '@my-calibre-server/api-interfaces';
import { SeriesCardComponent } from './series-card.component';

describe('SeriesCardComponent', () => {
  let component: SeriesCardComponent;
  let mockRouter: jest.Mocked<Router>;

  function makeSeries(overrides: Partial<Series> = {}): Series {
    return { ...new Series(), series_id: 1, series_name: 'Dune Saga', author_name: ['Frank Herbert'], books: [], ...overrides };
  }

  beforeEach(() => {
    mockRouter = { navigate: jest.fn() } as unknown as jest.Mocked<Router>;
    component = new SeriesCardComponent(mockRouter);
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
      component.toggleBooksClosed();
      expect(component.booksClosed).toBe(true);
    });
  });

  describe('dotColor', () => {
    it('should cycle through the palette based on index', () => {
      component.index = 0;
      const first = component.dotColor;
      component.index = 8;
      expect(component.dotColor).toBe(first);
    });

    it('should return different colors for different indexes within the palette size', () => {
      component.index = 0;
      const first = component.dotColor;
      component.index = 1;
      expect(component.dotColor).not.toBe(first);
    });
  });

  describe('openBook', () => {
    it('should stop event propagation and navigate to the book page', () => {
      const event = { stopPropagation: jest.fn() } as unknown as Event;

      component.openBook(event, 42);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/book', 42]);
    });
  });

  describe('series input', () => {
    it('should accept a series with multiple authors', () => {
      component.series = makeSeries({ author_name: ['Frank Herbert', 'Brian Herbert'] });
      expect(component.series.author_name).toHaveLength(2);
    });
  });
});
