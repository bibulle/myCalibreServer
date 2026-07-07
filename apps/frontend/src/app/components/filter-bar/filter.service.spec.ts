import { TestBed } from '@angular/core/testing';
import { Filter, FilterService, LangAvailable, sortLabelKey, SortingDirection, SortType } from './filter.service';

describe('FilterService', () => {
  let service: FilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FilterService],
    });
    service = TestBed.inject(FilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with default filter', (done) => {
      service.currentFilterObservable().subscribe((filter) => {
        expect(filter).toBeDefined();
        expect(filter.sort).toBe(SortType.Name);
        expect(filter.sorting_direction).toBe(SortingDirection.Asc);
        expect(filter.search).toBe('');
        expect(filter.not_displayed).toBe(false);
        expect(filter.limit_to).toEqual([]);
        expect(filter.lang).toBe(LangAvailable.All);
        done();
      });
    });
  });

  describe('update', () => {
    it('should update filter and emit new value', (done) => {
      const newFilter = new Filter();
      newFilter.sort = SortType.PublishDate;
      newFilter.search = 'test';

      let emissionCount = 0;
      service.currentFilterObservable().subscribe((filter) => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(filter.sort).toBe(SortType.PublishDate);
          expect(filter.search).toBe('test');
          done();
        }
      });

      service.update(newFilter);
    });

    it('should replace entire filter object', (done) => {
      const newFilter = new Filter();
      newFilter.not_displayed = true;
      newFilter.limit_to = [SortType.Author, SortType.Name];

      let emissionCount = 0;
      service.currentFilterObservable().subscribe((filter) => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(filter.not_displayed).toBe(true);
          expect(filter.limit_to).toEqual([SortType.Author, SortType.Name]);
          done();
        }
      });

      service.update(newFilter);
    });
  });

  describe('updateNotDisplayed', () => {
    it('should update not_displayed flag and emit', (done) => {
      let emissionCount = 0;
      service.currentFilterObservable().subscribe((filter) => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(filter.not_displayed).toBe(true);
          done();
        }
      });

      service.updateNotDisplayed(true);
    });

    it('should not emit if value unchanged', (done) => {
      let emissionCount = 0;

      // Subscribe first to get initial emission
      service.currentFilterObservable().subscribe(() => {
        emissionCount++;
      });

      const initialCount = emissionCount;
      service.updateNotDisplayed(false); // Same as default

      setTimeout(() => {
        expect(emissionCount).toBe(initialCount); // No additional emission
        done();
      }, 50);
    });

    it('should toggle not_displayed correctly', (done) => {
      let emissionCount = 0;
      const emissions: boolean[] = [];

      service.currentFilterObservable().subscribe((filter) => {
        emissions.push(filter.not_displayed);
        emissionCount++;
      });

      service.updateNotDisplayed(true);
      service.updateNotDisplayed(false);

      setTimeout(() => {
        expect(emissions).toEqual([false, true, false]);
        done();
      }, 50);
    });
  });

  describe('updateAllButNotDisplayed', () => {
    it('should update filter while preserving not_displayed', (done) => {
      let emissionCount = 0;

      // Subscribe first to catch all emissions
      service.currentFilterObservable().subscribe((filter) => {
        emissionCount++;
        if (emissionCount === 3) {
          // Initial + updateNotDisplayed + updateAllButNotDisplayed
          expect(filter.sort).toBe(SortType.Author);
          expect(filter.search).toBe('test');
          expect(filter.not_displayed).toBe(true); // Preserved from before
          done();
        }
      });

      // First set not_displayed to true
      service.updateNotDisplayed(true);

      const newFilter = new Filter();
      newFilter.sort = SortType.Author;
      newFilter.search = 'test';
      newFilter.not_displayed = false; // This should be ignored

      service.updateAllButNotDisplayed(newFilter);
    });

    it('should preserve false not_displayed value', (done) => {
      const newFilter = new Filter();
      newFilter.sort = SortType.PublishDate;

      let emissionCount = 0;
      service.currentFilterObservable().subscribe((filter) => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(filter.sort).toBe(SortType.PublishDate);
          expect(filter.not_displayed).toBe(false);
          done();
        }
      });

      service.updateAllButNotDisplayed(newFilter);
    });
  });

  describe('updateSearch', () => {
    it('should update search and emit', (done) => {
      let emissionCount = 0;
      service.currentFilterObservable().subscribe((filter) => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(filter.search).toBe('fantasy');
          done();
        }
      });

      service.updateSearch('fantasy');
    });

    it('should not emit if search unchanged', (done) => {
      let emissionCount = 0;

      service.currentFilterObservable().subscribe(() => {
        emissionCount++;
      });

      const initialCount = emissionCount;
      service.updateSearch(''); // Same as default

      setTimeout(() => {
        expect(emissionCount).toBe(initialCount); // No additional emission
        done();
      }, 50);
    });

    it('should handle multiple search updates', (done) => {
      const searches: string[] = [];

      service.currentFilterObservable().subscribe((filter) => {
        searches.push(filter.search);
      });

      service.updateSearch('a');
      service.updateSearch('ab');
      service.updateSearch('abc');

      setTimeout(() => {
        expect(searches).toEqual(['', 'a', 'ab', 'abc']);
        done();
      }, 50);
    });
  });

  describe('updateLimitTo', () => {
    it('should update limit_to and emit', (done) => {
      const limitTo = [SortType.Author, SortType.PublishDate];

      let emissionCount = 0;
      service.currentFilterObservable().subscribe((filter) => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(filter.limit_to).toEqual(limitTo);
          done();
        }
      });

      service.updateLimitTo(limitTo);
    });

    it('should emit even with empty array (reference comparison)', (done) => {
      let emissionCount = 0;

      service.currentFilterObservable().subscribe(() => {
        emissionCount++;
      });

      const initialCount = emissionCount;
      service.updateLimitTo([]); // Different reference, will emit

      setTimeout(() => {
        expect(emissionCount).toBe(initialCount + 1); // Will emit due to reference change
        done();
      }, 50);
    });

    it('should replace entire limit_to array', (done) => {
      let emissionCount = 0;
      const emissions: SortType[][] = [];

      service.currentFilterObservable().subscribe((filter) => {
        emissions.push([...filter.limit_to]);
        emissionCount++;
      });

      service.updateLimitTo([SortType.Name]);
      service.updateLimitTo([SortType.Author, SortType.PublishDate]);

      setTimeout(() => {
        expect(emissions[0]).toEqual([]);
        expect(emissions[1]).toEqual([SortType.Name]);
        expect(emissions[2]).toEqual([SortType.Author, SortType.PublishDate]);
        done();
      }, 50);
    });
  });

  describe('currentFilterObservable', () => {
    it('should return observable', () => {
      const observable = service.currentFilterObservable();
      expect(observable).toBeDefined();
      expect(observable.subscribe).toBeDefined();
    });

    it('should emit current filter on subscription', (done) => {
      service.updateSearch('initial');

      setTimeout(() => {
        service.currentFilterObservable().subscribe((filter) => {
          expect(filter.search).toBe('initial');
          done();
        });
      }, 50);
    });

    it('should support multiple subscribers', (done) => {
      let count1 = 0;
      let count2 = 0;

      service.currentFilterObservable().subscribe(() => count1++);
      service.currentFilterObservable().subscribe(() => count2++);

      service.updateSearch('test');

      setTimeout(() => {
        expect(count1).toBe(2); // Initial + update
        expect(count2).toBe(2); // Initial + update
        done();
      }, 50);
    });
  });
});

describe('Filter', () => {
  describe('constructor', () => {
    it('should create with default values', () => {
      const filter = new Filter();

      expect(filter.sort).toBe(SortType.Name);
      expect(filter.sorting_direction).toBe(SortingDirection.Asc);
      expect(filter.search).toBe('');
      expect(filter.not_displayed).toBe(false);
      expect(filter.limit_to).toEqual([]);
      expect(filter.lang).toBe(LangAvailable.All);
    });

    it('should accept not_displayed option', () => {
      const filter = new Filter({ not_displayed: true });
      expect(filter.not_displayed).toBe(true);
    });

    it('should accept limit_to option', () => {
      const limitTo: any = [SortType.Author];
      const filter = new Filter({ limit_to: limitTo });
      expect(filter.limit_to).toEqual([SortType.Author]);
    });

    it('should accept both options', () => {
      const limitTo: any = [SortType.Name, SortType.PublishDate];
      const filter = new Filter({ not_displayed: true, limit_to: limitTo });

      expect(filter.not_displayed).toBe(true);
      expect(filter.limit_to).toEqual([SortType.Name, SortType.PublishDate]);
    });

    it('should ignore not_displayed when false', () => {
      const filter = new Filter({ not_displayed: false });
      expect(filter.not_displayed).toBe(false);
    });
  });

  describe('isAvailable', () => {
    it('should return true when limit_to is empty', () => {
      const filter = new Filter();
      expect(filter.isAvailable(SortType.Name)).toBe(true);
      expect(filter.isAvailable(SortType.Author)).toBe(true);
      expect(filter.isAvailable(SortType.PublishDate)).toBe(true);
    });

    it('should return true for types in limit_to', () => {
      const filter = new Filter({ limit_to: [SortType.Name, SortType.Author] as any });

      expect(filter.isAvailable(SortType.Name)).toBe(true);
      expect(filter.isAvailable(SortType.Author)).toBe(true);
    });

    it('should return false for types not in limit_to', () => {
      const filter = new Filter({ limit_to: [SortType.Name] as any });

      expect(filter.isAvailable(SortType.Author)).toBe(false);
      expect(filter.isAvailable(SortType.PublishDate)).toBe(false);
      expect(filter.isAvailable(SortType.PublicRating)).toBe(false);
    });

    it('should handle all SortType values', () => {
      const filter = new Filter({
        limit_to: [SortType.Name, SortType.PublishDate, SortType.Author, SortType.PublicRating, SortType.ReaderRating] as any,
      });

      expect(filter.isAvailable(SortType.Name)).toBe(true);
      expect(filter.isAvailable(SortType.PublishDate)).toBe(true);
      expect(filter.isAvailable(SortType.Author)).toBe(true);
      expect(filter.isAvailable(SortType.PublicRating)).toBe(true);
      expect(filter.isAvailable(SortType.ReaderRating)).toBe(true);
    });
  });

  describe('isLangSelected', () => {
    it('should return true when filter lang is All', () => {
      const filter = new Filter();
      filter.lang = LangAvailable.All;

      expect(filter.isLangSelected(LangAvailable.Fra)).toBe(true);
      expect(filter.isLangSelected(LangAvailable.Eng)).toBe(true);
      expect(filter.isLangSelected(LangAvailable.All)).toBe(true);
    });

    it('should return true only for matching lang', () => {
      const filter = new Filter();
      filter.lang = LangAvailable.Fra;

      expect(filter.isLangSelected(LangAvailable.Fra)).toBe(true);
      expect(filter.isLangSelected(LangAvailable.Eng)).toBe(false);
      expect(filter.isLangSelected(LangAvailable.All)).toBe(false);
    });

    it('should handle English selection', () => {
      const filter = new Filter();
      filter.lang = LangAvailable.Eng;

      expect(filter.isLangSelected(LangAvailable.Eng)).toBe(true);
      expect(filter.isLangSelected(LangAvailable.Fra)).toBe(false);
    });
  });
});

describe('Enums', () => {
  describe('SortType', () => {
    it('should have all expected values', () => {
      expect(SortType.Name).toBeDefined();
      expect(SortType.PublishDate).toBeDefined();
      expect(SortType.Author).toBeDefined();
      expect(SortType.PublicRating).toBeDefined();
      expect(SortType.ReaderRating).toBeDefined();
      expect(SortType.Count).toBeDefined();
    });
  });

  describe('SortingDirection', () => {
    it('should have ascending and descending', () => {
      expect(SortingDirection.Asc).toBeDefined();
      expect(SortingDirection.Desc).toBeDefined();
    });
  });

  describe('LangAvailable', () => {
    it('should have all language options', () => {
      expect(LangAvailable.All).toBeDefined();
      expect(LangAvailable.Fra).toBeDefined();
      expect(LangAvailable.Eng).toBeDefined();
    });
  });

  describe('sortLabelKey', () => {
    it('should map each sort type to its translation key', () => {
      expect(sortLabelKey(SortType.Name)).toBe('label.name');
      expect(sortLabelKey(SortType.PublishDate)).toBe('label.publish_date');
      expect(sortLabelKey(SortType.Author)).toBe('label.author');
      expect(sortLabelKey(SortType.PublicRating)).toBe('label.rating-public');
      expect(sortLabelKey(SortType.ReaderRating)).toBe('label.rating-reader');
      expect(sortLabelKey(SortType.Count)).toBe('label.sort-count');
    });
  });
});
