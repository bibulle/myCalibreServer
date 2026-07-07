import {Component, NgModule, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';

import {Subject, Subscription} from 'rxjs';

import {defaultSortingDirection, Filter, FilterService, LangAvailable, sortLabelKey, SortType} from './filter.service';
import { MatIconModule } from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {debounceTime} from 'rxjs/operators';
import { MatMenuModule } from '@angular/material/menu';

@Component({
    selector: 'my-calibre-server-filter-bar',
    templateUrl: './filter-bar.component.html',
    styleUrls: ['./filter-bar.component.scss'],
    standalone: false
})
export class FilterBarComponent implements OnInit, OnDestroy {

  filter = new Filter();

  // The queue to manage user choices
  private subjectFilter: Subject<Filter> | undefined;


  private _currentFilterSubscription: Subscription | undefined;
  private _userChoiceSubscription: Subscription | undefined;

  constructor(private _filterService: FilterService) {

  }

  ngOnInit() {
    // Apply UI changes
    if (!this.subjectFilter) {
      this.subjectFilter = new Subject<Filter>();
      this._userChoiceSubscription = this.subjectFilter
        .pipe(debounceTime(500))
        .subscribe(
          filter => {
            this._filterService.update(filter);
          },
          error => {
            console.log(error);
          }
        );
    }

    this._currentFilterSubscription = this._filterService.currentFilterObservable().subscribe(
      filter => {
        this.filter = filter;
      }
    )
  }

  //noinspection JSUnusedGlobalSymbols
  ngOnDestroy() {
    // console.log("ngOnDestroy");
    if (this._userChoiceSubscription) {
      this._userChoiceSubscription.unsubscribe();
    }
    if (this._currentFilterSubscription) {
      this._currentFilterSubscription.unsubscribe();
    }
  }


  private static readonly DEFAULT_SORT_OPTIONS = [SortType.Name, SortType.PublishDate, SortType.Author, SortType.PublicRating, SortType.ReaderRating];

  get sortLabel(): string {
    return sortLabelKey(this.filter.sort);
  }

  /**
   * The sort options to display, in order. Each page controls its own
   * order via FilterService.updateLimitTo() (see the "Reliure" handoff's
   * per-page SORT_CONFIGS); an empty limit_to (no restriction) falls back
   * to the original fixed order.
   */
  get sortOptions(): SortType[] {
    return this.filter.limit_to.length > 0 ? this.filter.limit_to : FilterBarComponent.DEFAULT_SORT_OPTIONS;
  }

  sortOptionLabelKey(sortType: SortType): string {
    return sortLabelKey(sortType);
  }

  toggleSort(sortType: SortType) {
    if (this.filter.sort === sortType) {
      this.filter.sorting_direction = (this.filter.sorting_direction + 1) % 2;
    } else {
      this.filter.sort = sortType;
      this.filter.sorting_direction = defaultSortingDirection(sortType);
    }
    this.filterList();
  }

  toggleLang(lang: LangAvailable) {
    switch (lang) {
      case LangAvailable.All:
        this.filter.lang = LangAvailable.All;
        break;
      case LangAvailable.Fra:
        switch (this.filter.lang) {
          case LangAvailable.All:
            this.filter.lang = LangAvailable.Fra;
            break;
          case LangAvailable.Fra:
            this.filter.lang = LangAvailable.Eng;
            break;
          case LangAvailable.Eng:
            this.filter.lang = LangAvailable.All;
        }
        break;
      case LangAvailable.Eng:
        switch (this.filter.lang) {
          case LangAvailable.All:
            this.filter.lang = LangAvailable.Eng;
            break;
          case LangAvailable.Eng:
            this.filter.lang = LangAvailable.Fra;
            break;
          case LangAvailable.Fra:
            this.filter.lang = LangAvailable.All;
        }
        break;
    }
    this.filterList();
  }


  /**
   * Add an event to sort/filter
   */
  filterList() {
    this.subjectFilter?.next(this.filter);
  }

}

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatMenuModule,
    TranslatePipe,
  ],
  declarations: [
    FilterBarComponent
  ],
  providers: [
    FilterService
  ],
  exports: [
    FilterBarComponent
  ]
})
export class FilterBarModule {
}
