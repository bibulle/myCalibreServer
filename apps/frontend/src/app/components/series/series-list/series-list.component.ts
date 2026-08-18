import { AfterViewInit, Component, NgModule, OnDestroy, OnInit } from '@angular/core';
import { Filter, FilterService, LangAvailable, SortingDirection, SortType } from '../../filter-bar/filter.service';
import { matchesSearch } from '../../filter-bar/search-util';
import { SeriesService } from '../series.service';
import { CommonModule } from '@angular/common';
import { FilterBarModule } from '../../filter-bar/filter-bar.component';
import { SeriesCardModule } from '../series-card/series-card.component';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Series } from '@my-calibre-server/api-interfaces';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../notification/notification.service';

@Component({
  selector: 'my-calibre-server-series-list',
  templateUrl: './series-list.component.html',
  styleUrls: ['./series-list.component.scss'],
  standalone: false,
})
export class SeriesListComponent implements OnInit, OnDestroy, AfterViewInit {
  MAX_SERIES = 100;
  param = {
    max: this.MAX_SERIES,
    totalCount: this.MAX_SERIES,
  };

  series: Series[] = [];
  fullSeries: Series[] = [];

  selectedId?: number;

  totalSeriesCount = 0;

  filter: Filter = new Filter();
  private previousFilterJson = '';
  filterCount = 0;

  private _currentFilterSubscription?: Subscription;

  constructor(
    private _seriesService: SeriesService,
    private _filterService: FilterService,
    private route: ActivatedRoute,
    private _notificationService: NotificationService,
    private _translateService: TranslateService
  ) {}

  get subtitle(): string {
    return this._translateService.instant('label.series-subtitle', { count: this.totalSeriesCount });
  }

  //noinspection JSUnusedGlobalSymbols
  ngOnInit() {
    // Search for params (search)
    this.route.queryParams.forEach((params: Params) => {
      if (params['id']) {
        this.selectedId = params['id'];
      }
      if (params['name']) {
        this._filterService.updateSearch(params['name']);
      }
    });

    this._filterService.updateNotDisplayed(false);
    this._filterService.updateLimitTo([SortType.PublishDate, SortType.Name, SortType.Author, SortType.Count]);
    this._currentFilterSubscription = this._filterService.currentFilterObservable().subscribe((filter: Filter) => {
      // console.log(filter);
      this.filter = filter;
      if (this.fullSeries) {
        this._fillSeries();
      }
    });

    this._seriesService
      .getSeries()
      .then((series) => {
        this.fullSeries = series;
        this._fillSeries();
      })
      .catch((err) => {
        console.log(err);
        this._notificationService.error(err);
      });
  }

  //noinspection JSUnusedGlobalSymbols
  ngAfterViewInit() {
    // if it's only a tag, scroll to top
    if (this.selectedId) {
      setTimeout(() => {
        const element = document?.querySelector('#scrollView')?.parentElement;
        if (element) {
          element.scrollTop = 0;
        }
      });
    }
  }

  //noinspection JSUnusedGlobalSymbols
  ngOnDestroy() {
    // console.log("ngOnDestroy");
    if (this._currentFilterSubscription) {
      this._currentFilterSubscription.unsubscribe();
    }
  }

  /**
   * fill the this.series list (slowly) with the filtered this.fullSeries list
   * @private
   */
  private _fillSeries() {
    if (!this.fullSeries || !this.filter) {
      return;
    }
    const _filterCount = ++this.filterCount;

    const tmpSeries = this._filterAndSortSeries();

    // console.log(tmpSeries);
    if (tmpSeries) {
      let cpt = 0;
      const STEP = 5;

      // if series list exists already, start from books length
      if (this.series) {
        cpt = Math.min(Math.ceil(this.series.length / STEP), Math.floor(tmpSeries.length / STEP)) + 1;
      }
      const initCpt = cpt;

      while (cpt * STEP <= tmpSeries.length + STEP) {
        const _cpt = cpt + 1;
        setTimeout(() => {
          if (_filterCount === this.filterCount) {
            this.series = tmpSeries.filter((b, i) => {
              return i < _cpt * STEP;
            });
          }
        }, 100 * (cpt - initCpt));

        cpt++;
      }
    }
  }

  /**
   * Filter and sort the this.fullSeries list with the this.filter
   * @returns {Series[]} or null is nothing to do
   * @private
   */
  _filterAndSortSeries(): Series[] | null {
    const filterJson = JSON.stringify(this.filter);
    if (this.previousFilterJson === filterJson && this.series != null && this.series.length === this.fullSeries.length) {
      return [];
    }
    this.previousFilterJson = filterJson;

    // first filter
    const filteredSeries = this.fullSeries
      // filter on text
      .filter((s: Series) => {
        const strToSearch = s.series_name.concat(s.author_name.toString()).concat(
          s.books.reduce((p, c) => {
            return p + c;
          }, '')
        );

        return matchesSearch(strToSearch, this.filter.search);
      })
      // filter on language
      .filter((s: Series) => {
        if (!s.allBooks) {
          s.allBooks = s.books;
        }

        s.books = s.allBooks.filter((b) => {
          return b.lang_code === LangAvailable[this.filter.lang].toLowerCase() || this.filter.lang === LangAvailable.All;
        });

        return s.books.length !== 0;
      })
      .sort((b1: Series, b2: Series) => {
        if (this.filter.sort === SortType.Count) {
          const diff = b1.books.length - b2.books.length;
          return this.filter.sorting_direction === SortingDirection.Asc ? diff : -diff;
        }

        let v1: string;
        let v2: string;
        v1 = b1.series_sort;
        v2 = b2.series_sort;
        switch (this.filter.sort) {
          case SortType.Name:
            break;
          case SortType.Author:
            {
              const v1Lst = b1.author_sort.concat();
              const v2Lst = b2.author_sort.concat();
              if (this.filter.sorting_direction === SortingDirection.Desc) {
                v1Lst.reverse();
                v2Lst.reverse();
              }
              v1 = v1Lst.toString() + ' ' + v1;
              v2 = v2Lst.toString() + ' ' + v2;
            }
            break;
          case SortType.PublishDate:
          default:
            {
              const v1Lst = b1.book_date.concat();
              const v2Lst = b2.book_date.concat();
              if (this.filter.sorting_direction === SortingDirection.Desc) {
                v1Lst.reverse();
                v2Lst.reverse();
              }
              v1 = v1Lst.toString() + ' ' + v1;
              v2 = v2Lst.toString() + ' ' + v2;
            }
            break;
        }

        switch (this.filter.sorting_direction) {
          case SortingDirection.Asc:
            return v1.localeCompare(v2);
          case SortingDirection.Desc:
          default:
            return v2.localeCompare(v1);
        }
      });

    this.totalSeriesCount = filteredSeries.length;
    this.param.totalCount = this.totalSeriesCount;

    // then limit size
    return filteredSeries.filter((b, i) => {
      return i < this.MAX_SERIES;
    });
  }
}

@NgModule({
  imports: [CommonModule, MatProgressSpinnerModule, SeriesCardModule, FilterBarModule, TranslatePipe],
  declarations: [SeriesListComponent],
  exports: [SeriesListComponent],
})
export class SeriesListModule {}
