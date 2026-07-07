import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterBarComponent } from './filter-bar.component';
import { FilterService, Filter, SortType, SortingDirection, LangAvailable } from './filter.service';
import { of, Subject } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('FilterBarComponent', () => {
  let component: FilterBarComponent;
  let fixture: ComponentFixture<FilterBarComponent>;
  let mockFilterService: jest.Mocked<FilterService>;
  let filterSubject: Subject<Filter>;

  beforeEach(async () => {
    filterSubject = new Subject<Filter>();

    mockFilterService = {
      currentFilterObservable: jest.fn().mockReturnValue(filterSubject.asObservable()),
      update: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      declarations: [FilterBarComponent],
      providers: [{ provide: FilterService, useValue: mockFilterService }, provideTranslateService()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterBarComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() here to avoid template initialization
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default Filter', () => {
      expect(component.filter).toBeInstanceOf(Filter);
    });

    it('should have undefined subscriptions before init', () => {
      expect(component['_currentFilterSubscription']).toBeUndefined();
      expect(component['_userChoiceSubscription']).toBeUndefined();
      expect(component['subjectFilter']).toBeUndefined();
    });
  });

  describe('ngOnInit', () => {
    it('should create subject and subscribe to filter service', () => {
      component.ngOnInit(); // Initialize without template

      expect(component['subjectFilter']).toBeDefined();
      expect(component['_currentFilterSubscription']).toBeDefined();
      expect(component['_userChoiceSubscription']).toBeDefined();
      expect(mockFilterService.currentFilterObservable).toHaveBeenCalled();
    });

    it('should update component filter when service filter changes', (done) => {
      component.ngOnInit();

      const newFilter = new Filter();
      newFilter.search = 'test search';
      newFilter.sort = SortType.Name;

      setTimeout(() => {
        filterSubject.next(newFilter);

        setTimeout(() => {
          expect(component.filter.search).toBe('test search');
          expect(component.filter.sort).toBe(SortType.Name);
          done();
        }, 50);
      }, 50);
    });

    it('should setup debounced filter updates (500ms)', (done) => {
      component.ngOnInit();

      const filter = new Filter();
      filter.search = 'debounced';

      // Emit filter change
      component['subjectFilter']?.next(filter);

      // Check immediately - should not be called yet
      expect(mockFilterService.update).not.toHaveBeenCalled();

      // Check after 300ms - still not called
      setTimeout(() => {
        expect(mockFilterService.update).not.toHaveBeenCalled();
      }, 300);

      // Check after 600ms - should be called
      setTimeout(() => {
        expect(mockFilterService.update).toHaveBeenCalledWith(filter);
        done();
      }, 600);
    });

    it('should only create subject once', () => {
      component.ngOnInit();
      const firstSubject = component['subjectFilter'];

      // Call ngOnInit again
      component.ngOnInit();

      expect(component['subjectFilter']).toBe(firstSubject);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', () => {
      component.ngOnInit();

      const userChoiceSub = component['_userChoiceSubscription'];
      const currentFilterSub = component['_currentFilterSubscription'];

      const userChoiceUnsubSpy = jest.spyOn(userChoiceSub!, 'unsubscribe');
      const currentFilterUnsubSpy = jest.spyOn(currentFilterSub!, 'unsubscribe');

      component.ngOnDestroy();

      expect(userChoiceUnsubSpy).toHaveBeenCalled();
      expect(currentFilterUnsubSpy).toHaveBeenCalled();
    });

    it('should handle undefined subscriptions gracefully', () => {
      // Don't call ngOnInit, so subscriptions are undefined
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('sortLabel', () => {
    it('should return the translation key for the current sort type', () => {
      component.filter.sort = SortType.Name;
      expect(component.sortLabel).toBe('label.name');

      component.filter.sort = SortType.PublishDate;
      expect(component.sortLabel).toBe('label.publish_date');

      component.filter.sort = SortType.Author;
      expect(component.sortLabel).toBe('label.author');

      component.filter.sort = SortType.PublicRating;
      expect(component.sortLabel).toBe('label.rating-public');

      component.filter.sort = SortType.ReaderRating;
      expect(component.sortLabel).toBe('label.rating-reader');

      component.filter.sort = SortType.Count;
      expect(component.sortLabel).toBe('label.sort-count');
    });
  });

  describe('sortOptions', () => {
    it('should fall back to the default fixed order when limit_to is empty', () => {
      component.filter.limit_to = [];

      expect(component.sortOptions).toEqual([SortType.Name, SortType.PublishDate, SortType.Author, SortType.PublicRating, SortType.ReaderRating]);
    });

    it("should use the page-provided order when limit_to is set (each page's own SORT_CONFIGS order)", () => {
      component.filter.limit_to = [SortType.Count, SortType.Name];

      expect(component.sortOptions).toEqual([SortType.Count, SortType.Name]);
    });
  });

  describe('sortOptionLabelKey', () => {
    it('should delegate to sortLabelKey', () => {
      expect(component.sortOptionLabelKey(SortType.Count)).toBe('label.sort-count');
      expect(component.sortOptionLabelKey(SortType.Author)).toBe('label.author');
    });
  });

  describe('toggleSort', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should change sort type and reset to Asc direction', (done) => {
      component.filter.sort = SortType.PublishDate;
      component.filter.sorting_direction = SortingDirection.Desc;

      component.toggleSort(SortType.Name);

      expect(component.filter.sort).toBe(SortType.Name);
      expect(component.filter.sorting_direction).toBe(SortingDirection.Asc);

      setTimeout(() => {
        expect(mockFilterService.update).toHaveBeenCalled();
        done();
      }, 600);
    });

    it('should toggle direction when clicking same sort type', (done) => {
      component.filter.sort = SortType.Author;
      component.filter.sorting_direction = SortingDirection.Asc;

      component.toggleSort(SortType.Author);

      expect(component.filter.sort).toBe(SortType.Author);
      expect(component.filter.sorting_direction).toBe(SortingDirection.Desc);

      component.toggleSort(SortType.Author);

      expect(component.filter.sorting_direction).toBe(SortingDirection.Asc);

      setTimeout(() => {
        expect(mockFilterService.update).toHaveBeenCalled();
        done();
      }, 600);
    });

    it('should call filterList to emit change', () => {
      const filterListSpy = jest.spyOn(component, 'filterList');

      component.toggleSort(SortType.PublicRating);

      expect(filterListSpy).toHaveBeenCalled();
    });
  });

  describe('toggleLang', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should set to All when All is clicked', (done) => {
      component.filter.lang = LangAvailable.Fra;

      component.toggleLang(LangAvailable.All);

      expect(component.filter.lang).toBe(LangAvailable.All);

      setTimeout(() => {
        expect(mockFilterService.update).toHaveBeenCalled();
        done();
      }, 600);
    });

    it('should cycle Fra: All -> Fra -> Eng -> All', (done) => {
      component.filter.lang = LangAvailable.All;
      component.toggleLang(LangAvailable.Fra);
      expect(component.filter.lang).toBe(LangAvailable.Fra);

      component.toggleLang(LangAvailable.Fra);
      expect(component.filter.lang).toBe(LangAvailable.Eng);

      component.toggleLang(LangAvailable.Fra);
      expect(component.filter.lang).toBe(LangAvailable.All);

      setTimeout(() => {
        expect(mockFilterService.update).toHaveBeenCalled();
        done();
      }, 600);
    });

    it('should cycle Eng: All -> Eng -> Fra -> All', (done) => {
      component.filter.lang = LangAvailable.All;
      component.toggleLang(LangAvailable.Eng);
      expect(component.filter.lang).toBe(LangAvailable.Eng);

      component.toggleLang(LangAvailable.Eng);
      expect(component.filter.lang).toBe(LangAvailable.Fra);

      component.toggleLang(LangAvailable.Eng);
      expect(component.filter.lang).toBe(LangAvailable.All);

      setTimeout(() => {
        expect(mockFilterService.update).toHaveBeenCalled();
        done();
      }, 600);
    });

    it('should call filterList to emit change', () => {
      const filterListSpy = jest.spyOn(component, 'filterList');

      component.toggleLang(LangAvailable.Fra);

      expect(filterListSpy).toHaveBeenCalled();
    });
  });

  describe('filterList', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should emit filter through subject', (done) => {
      const testFilter = new Filter();
      testFilter.search = 'test';
      component.filter = testFilter;

      component.filterList();

      setTimeout(() => {
        expect(mockFilterService.update).toHaveBeenCalledWith(expect.objectContaining({ search: 'test' }));
        done();
      }, 600);
    });

    it('should handle undefined subjectFilter', () => {
      component['subjectFilter'] = undefined;

      expect(() => component.filterList()).not.toThrow();
    });
  });

  describe('integration', () => {
    it('should handle complete user workflow', (done) => {
      component.ngOnInit();

      // User changes language
      component.toggleLang(LangAvailable.Fra);
      expect(component.filter.lang).toBe(LangAvailable.Fra);

      // User changes sort
      component.toggleSort(SortType.PublishDate);
      expect(component.filter.sort).toBe(SortType.PublishDate);
      expect(component.filter.sorting_direction).toBe(SortingDirection.Asc);

      // User toggles sort direction
      component.toggleSort(SortType.PublishDate);
      expect(component.filter.sorting_direction).toBe(SortingDirection.Desc);

      // Wait for debounce
      setTimeout(() => {
        expect(mockFilterService.update).toHaveBeenCalledWith(
          expect.objectContaining({
            lang: LangAvailable.Fra,
            sort: SortType.PublishDate,
            sorting_direction: SortingDirection.Desc,
          })
        );
        done();
      }, 600);
    });

    it('should receive filter updates from service', (done) => {
      component.ngOnInit();

      const serviceFilter = new Filter();
      serviceFilter.search = 'service update';
      serviceFilter.lang = LangAvailable.Eng;

      setTimeout(() => {
        filterSubject.next(serviceFilter);

        setTimeout(() => {
          expect(component.filter.search).toBe('service update');
          expect(component.filter.lang).toBe(LangAvailable.Eng);
          done();
        }, 50);
      }, 50);
    });
  });
});
