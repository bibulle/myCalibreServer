import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class FilterService {

  private currentFilterSubject: BehaviorSubject<Filter>;
  private lastFilter = new Filter();

  constructor () {

    this.currentFilterSubject = new BehaviorSubject<Filter>(this.lastFilter);


  }

  update (filter: Filter) {
    this.lastFilter = filter;
    this.currentFilterSubject.next(filter);
  }

  updateNotDisplayed (notDisplayed: boolean) {
    if (this.lastFilter.not_displayed !== notDisplayed) {
      this.lastFilter.not_displayed = notDisplayed;
      this.currentFilterSubject.next(this.lastFilter)
    }
  }
  updateAllButNotDisplayed (filter: Filter) {
    filter.not_displayed = this.lastFilter.not_displayed;
    this.currentFilterSubject.next(filter);
  }

  updateSearch (search: string) {
    if (this.lastFilter.search !== search) {
      this.lastFilter.search = search;
      this.currentFilterSubject.next(this.lastFilter)
    }
  }

  updateLimitTo (limit_to: SortType[]) {
    if (this.lastFilter.limit_to !== limit_to) {
      this.lastFilter.limit_to = limit_to;
      this.currentFilterSubject.next(this.lastFilter)
    }
  }


  /**
   * Subscribe to know if current course changes
   */
  currentFilterObservable (): Observable<Filter> {
    return this.currentFilterSubject;
  }


}

export class Filter {
  sort = SortType.Name;
  sorting_direction = SortingDirection.Asc;
  search = '';
  not_displayed = false;
  limit_to: SortType[] = [];
  lang: LangAvailable = LangAvailable.All;

  constructor (options: {not_displayed?: boolean, limit_to?: []} = {}) {
    if (options.not_displayed) {
      this.not_displayed = true;
    }
    if (options.limit_to) {
      this.limit_to = options.limit_to;
    }
  };

  isAvailable (sortType: SortType): boolean {
    return (this.limit_to.length === 0) || (this.limit_to.some(s => s === sortType));
  }
  isLangSelected(lang: LangAvailable): boolean {
    return (this.lang === LangAvailable.All) || (this.lang === lang)
  }

}

export enum SortType {
  Name, PublishDate, Author, PublicRating, ReaderRating
}
export enum SortingDirection {
  Asc, Desc
}
export enum LangAvailable {
  All, Fra, Eng
}


