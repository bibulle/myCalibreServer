import {Component, NgModule, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {Subject, Subscription} from 'rxjs';

import {Filter, FilterService, LangAvailable, SortingDirection, SortType} from './filter.service';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TranslateModule} from '@ngx-translate/core';
import {HttpClientModule} from '@angular/common/http';
import {debounceTime} from 'rxjs/operators';

@Component({
  selector: 'filter-bar',
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.scss']
})
export class FilterBarComponent implements OnInit, OnDestroy {

  filter = new Filter();

  // The queue to manage user choices
  private subjectFilter: Subject<Filter>;


  private _currentFilterSubscription: Subscription;
  private _userChoiceSubscription: Subscription;

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


  toggleSort(sortType: SortType) {
    if (this.filter.sort === sortType) {
      this.filter.sorting_direction = (this.filter.sorting_direction + 1) % 2;
    } else {
      this.filter.sort = sortType;
      this.filter.sorting_direction = SortingDirection.Asc;
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
    this.subjectFilter.next(this.filter);
  }

}

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatMenuModule,
    FlexLayoutModule,
    TranslateModule,
    HttpClientModule
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
