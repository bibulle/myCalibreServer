import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Series } from '@my-calibre-server/api-interfaces';
import { SeriesListComponent } from './series-list.component';
import { SeriesService } from '../series.service';
import { Filter, FilterService } from '../../filter-bar/filter.service';
import { NotificationService } from '../../notification/notification.service';

describe('SeriesListComponent', () => {
  let component: SeriesListComponent;
  let mockSeriesService: jest.Mocked<SeriesService>;
  let mockFilterService: jest.Mocked<FilterService>;
  let mockRoute: ActivatedRoute;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockTranslateService: jest.Mocked<TranslateService>;

  function makeSeries(overrides: Partial<Series> = {}): Series {
    return { ...new Series(), series_id: 1, series_name: 'Dune Saga', author_name: ['Frank Herbert'], books: [], ...overrides };
  }

  beforeEach(() => {
    mockSeriesService = { getSeries: jest.fn(() => Promise.resolve([makeSeries()])) } as any;
    mockFilterService = {
      updateNotDisplayed: jest.fn(),
      updateLimitTo: jest.fn(),
      currentFilterObservable: jest.fn(() => of(new Filter())),
    } as any;
    mockRoute = { queryParams: of({}) } as any;
    mockNotificationService = { error: jest.fn() } as any;
    mockTranslateService = { instant: jest.fn((key, params) => `${key}:${JSON.stringify(params)}`) } as any;

    component = new SeriesListComponent(mockSeriesService, mockFilterService, mockRoute, mockNotificationService, mockTranslateService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should hide the header filter and fetch the series list', async () => {
      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockFilterService.updateNotDisplayed).toHaveBeenCalledWith(false);
      expect(mockSeriesService.getSeries).toHaveBeenCalled();
    });

    it('should read the selected id from the route query params', () => {
      mockRoute = { queryParams: of({ id: '3' }) } as any;
      component = new SeriesListComponent(mockSeriesService, mockFilterService, mockRoute, mockNotificationService, mockTranslateService);

      component.ngOnInit();

      expect(component.selectedId).toBe('3');
    });

    it('should notify an error when the series cannot be fetched', async () => {
      mockSeriesService.getSeries.mockReturnValue(Promise.reject('boom'));

      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockNotificationService.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('subtitle', () => {
    it('should translate with the total series count', () => {
      component.totalSeriesCount = 5;

      expect(component.subtitle).toBe('label.series-subtitle:{"count":5}');
      expect(mockTranslateService.instant).toHaveBeenCalledWith('label.series-subtitle', { count: 5 });
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
