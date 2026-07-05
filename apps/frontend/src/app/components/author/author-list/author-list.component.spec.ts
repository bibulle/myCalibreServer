import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Author } from '@my-calibre-server/api-interfaces';
import { AuthorListComponent } from './author-list.component';
import { AuthorService } from '../author.service';
import { Filter, FilterService } from '../../filter-bar/filter.service';
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

  describe('ngOnDestroy', () => {
    it('should unsubscribe from the filter subscription', () => {
      component.ngOnInit();
      const unsubscribeSpy = jest.spyOn((component as any)._currentFilterSubscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });
});
