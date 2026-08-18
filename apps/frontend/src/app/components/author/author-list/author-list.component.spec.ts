import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Author } from '@my-calibre-server/api-interfaces';
import { AuthorListComponent } from './author-list.component';
import { AuthorService } from '../author.service';
import { Filter, FilterService, SortingDirection, SortType } from '../../filter-bar/filter.service';
import { NotificationService } from '../../notification/notification.service';

describe('AuthorListComponent', () => {
  let component: AuthorListComponent;
  let mockAuthorService: jest.Mocked<AuthorService>;
  let mockFilterService: jest.Mocked<FilterService>;
  let mockRoute: ActivatedRoute;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockTranslateService: jest.Mocked<TranslateService>;

  function makeAuthor(overrides: Partial<Author> = {}): Author {
    return { ...new Author(), author_id: 1, author_name: 'Isaac Asimov', book_date: [], books: [], ...overrides };
  }

  beforeEach(() => {
    mockAuthorService = { getAuthors: jest.fn(() => Promise.resolve([makeAuthor()])) } as any;
    mockFilterService = {
      updateNotDisplayed: jest.fn(),
      updateLimitTo: jest.fn(),
      currentFilterObservable: jest.fn(() => of(new Filter())),
    } as any;
    mockRoute = { queryParams: of({}) } as any;
    mockNotificationService = { error: jest.fn() } as any;
    mockTranslateService = { instant: jest.fn((key, params) => `${key}:${JSON.stringify(params)}`) } as any;

    component = new AuthorListComponent(mockAuthorService, mockFilterService, mockRoute, mockNotificationService, mockTranslateService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should hide the header filter and fetch the author list', async () => {
      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockFilterService.updateNotDisplayed).toHaveBeenCalledWith(false);
      expect(mockAuthorService.getAuthors).toHaveBeenCalled();
    });

    it('should notify an error when the authors cannot be fetched', async () => {
      mockAuthorService.getAuthors.mockReturnValue(Promise.reject('boom'));

      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockNotificationService.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('subtitle', () => {
    it('should translate with the total authors count', () => {
      component.totalAuthorsCount = 12;

      expect(component.subtitle).toBe('label.authors-subtitle:{"count":12}');
      expect(mockTranslateService.instant).toHaveBeenCalledWith('label.authors-subtitle', { count: 12 });
    });
  });

  describe('_filterAndSortAuthors with SortType.Count', () => {
    beforeEach(() => {
      component.fullAuthors = [
        makeAuthor({ author_id: 1, author_name: 'Small', books: [{} as never] }),
        makeAuthor({ author_id: 2, author_name: 'Big', books: [{} as never, {} as never, {} as never] }),
        makeAuthor({ author_id: 3, author_name: 'Medium', books: [{} as never, {} as never] }),
      ];
    });

    it('should sort ascending by number of books', () => {
      component.filter = new Filter();
      component.filter.sort = SortType.Count;
      component.filter.sorting_direction = SortingDirection.Asc;

      const result = component._filterAndSortAuthors();

      expect(result?.map((a) => a.author_name)).toEqual(['Small', 'Medium', 'Big']);
    });

    it('should sort descending by number of books', () => {
      component.filter = new Filter();
      component.filter.sort = SortType.Count;
      component.filter.sorting_direction = SortingDirection.Desc;

      const result = component._filterAndSortAuthors();

      expect(result?.map((a) => a.author_name)).toEqual(['Big', 'Medium', 'Small']);
    });
  });

  describe('_filterAndSortAuthors with a text search', () => {
    beforeEach(() => {
      component.fullAuthors = [
        makeAuthor({ author_id: 1, author_name: 'Isaac Asimov', books: [{} as never] }),
        makeAuthor({ author_id: 2, author_name: 'Frank Herbert', books: [{} as never] }),
      ];
      component.filter = new Filter();
    });

    it('should match every word of the search independently of the order', () => {
      component.filter.search = 'asimov isaac';

      const result = component._filterAndSortAuthors();

      expect(result?.map((a) => a.author_name)).toEqual(['Isaac Asimov']);
    });

    it('should not match when one of the words belongs to another author', () => {
      component.filter.search = 'isaac herbert';

      const result = component._filterAndSortAuthors();

      expect(result).toEqual([]);
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
