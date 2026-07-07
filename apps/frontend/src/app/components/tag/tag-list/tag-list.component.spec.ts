import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Book, Tag } from '@my-calibre-server/api-interfaces';
import { TagListComponent } from './tag-list.component';
import { TagService } from '../tag.service';
import { Filter, FilterService } from '../../filter-bar/filter.service';
import { NotificationService } from '../../notification/notification.service';

describe('TagListComponent', () => {
  let component: TagListComponent;
  let mockTagService: jest.Mocked<TagService>;
  let mockFilterService: jest.Mocked<FilterService>;
  let mockRoute: ActivatedRoute;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockTranslateService: jest.Mocked<TranslateService>;
  let mockRouter: jest.Mocked<Router>;

  function makeTag(overrides: Partial<Tag> = {}): Tag {
    return { ...new Tag(), tag_id: 1, tag_name: 'Sci-Fi', books: [], ...overrides };
  }

  function makeBook(overrides: Partial<Book> = {}): Book {
    return { ...new Book(), book_id: 1, ...overrides };
  }

  beforeEach(() => {
    mockTagService = { getTags: jest.fn(() => Promise.resolve([makeTag()])) } as any;
    mockFilterService = {
      updateNotDisplayed: jest.fn(),
      updateLimitTo: jest.fn(),
      updateSearch: jest.fn(),
      currentFilterObservable: jest.fn(() => of(new Filter())),
    } as any;
    mockRoute = { queryParams: of({}) } as any;
    mockNotificationService = { error: jest.fn() } as any;
    mockTranslateService = { instant: jest.fn((key, params) => `${key}:${JSON.stringify(params)}`) } as any;
    mockRouter = { navigate: jest.fn() } as any;

    component = new TagListComponent(mockTagService, mockFilterService, mockRoute, mockNotificationService, mockTranslateService, mockRouter);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should hide the header filter and fetch the tag list', async () => {
      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockFilterService.updateNotDisplayed).toHaveBeenCalledWith(false);
      expect(mockTagService.getTags).toHaveBeenCalled();
    });

    it('should notify an error when the tags cannot be fetched', async () => {
      mockTagService.getTags.mockReturnValue(Promise.reject('boom'));

      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockNotificationService.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('tagSelected / selectedTag / selectedTagBooks', () => {
    it('should report no selection by default', () => {
      expect(component.tagSelected).toBe(false);
      expect(component.selectedTag).toBeUndefined();
      expect(component.selectedTagBooks).toEqual([]);
    });

    it('should resolve the selected tag and its books once an id is set', () => {
      const book = makeBook();
      component.tags = [makeTag({ tag_id: 1, tag_name: 'Sci-Fi', books: [book] })];
      component.selectedId = 1;

      expect(component.tagSelected).toBe(true);
      expect(component.selectedTag?.tag_name).toBe('Sci-Fi');
      expect(component.selectedTagBooks).toEqual([book]);
    });

    it('should report no selection when the selected id no longer matches a filtered tag', () => {
      // e.g. a language filter change excludes the previously selected tag
      component.tags = [];
      component.selectedId = 1;

      expect(component.tagSelected).toBe(false);
      expect(component.selectedTag).toBeUndefined();
      expect(component.selectedTagBooks).toEqual([]);
    });
  });

  describe('subtitle', () => {
    it('should translate the unfiltered subtitle with the total tag count', () => {
      component.totalTagsCount = 9;

      expect(component.subtitle).toBe('label.tags-subtitle:{"count":9}');
    });

    it('should translate the filtered subtitle when a tag is selected', () => {
      component.tags = [makeTag({ tag_id: 2, tag_name: 'Romance', books: [makeBook(), makeBook()] })];
      component.selectedId = 2;

      expect(component.subtitle).toBe('label.tags-subtitle-filtered:{"name":"Romance","count":2}');
    });
  });

  describe('tagWeight / tagFontSize', () => {
    beforeEach(() => {
      component.tags = [makeTag({ tag_id: 1, books: [makeBook(), makeBook()] }), makeTag({ tag_id: 2, books: [makeBook()] })];
    });

    it('should weight the selected tag the heaviest', () => {
      component.selectedId = 2;
      expect(component.tagWeight(component.tags[1])).toBe(700);
    });

    it('should weight tags above half the max count at 600', () => {
      expect(component.tagWeight(component.tags[0])).toBe(600);
    });

    it('should weight tags at or below half the max count at 500', () => {
      expect(component.tagWeight(component.tags[1])).toBe(500);
    });

    it('should scale the font size between the min and max', () => {
      expect(component.tagFontSize(component.tags[0])).toBe('17.5px');
      expect(component.tagFontSize(component.tags[1])).toBe('15.0px');
    });
  });

  describe('selectTag / clearTagFilter', () => {
    it('should select a tag not previously selected', () => {
      component.selectTag(makeTag({ tag_id: 5 }));
      expect(component.selectedId).toBe(5);
    });

    it('should toggle off a tag that is already selected', () => {
      component.selectedId = 5;
      component.selectTag(makeTag({ tag_id: 5 }));
      expect(component.selectedId).toBeUndefined();
    });

    it('should clear the selection and the global search', () => {
      component.selectedId = 5;

      component.clearTagFilter();

      expect(component.selectedId).toBeUndefined();
      expect(mockFilterService.updateSearch).toHaveBeenCalledWith('');
    });
  });

  describe('openBook', () => {
    it('should navigate to the book page', () => {
      component.openBook(42);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/book', 42]);
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
