import {Component, OnInit, NgModule, OnDestroy, AfterViewInit} from '@angular/core';
import { Series } from '../series';
import { Filter, FilterService, SortType, SortingDirection } from '../../filter-bar/filter.service';
import { SeriesService } from '../series.service';
import { CommonModule } from '@angular/common';
import { MatContentModule } from '../../content/content.component';
import { SeriesCardModule } from '../series-card/series-card.component';
import { MatProgressSpinnerModule } from '@angular/material';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs';
import {TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-series-list',
  templateUrl: './series-list.component.html',
  styleUrls: ['./series-list.component.scss']
})
export class SeriesListComponent implements OnInit, OnDestroy, AfterViewInit {

  MAX_SERIES = 100;
  param = {
    max: this.MAX_SERIES,
    totalCount: this.MAX_SERIES
  };

  series: Series[];
  fullSeries: Series[];

  selectedId: number;

  totalSeriesCount = 0;

  filter: Filter = new Filter();
  private previousFilterJson = '';
  filterCount = 0;

  private _currentFilterSubscription: Subscription;

  static _cleanAccent (str: string): string {
    return str.toLowerCase()
      .replace(/[àâªáäãåā]/g, 'a')
      .replace(/[èéêëęėē]/g, 'e')
      .replace(/[iïìíįī]/g, 'i')
      .replace(/[ôºöòóõøō]/g, 'o')
      .replace(/[ûùüúū]/g, 'u')
      .replace(/[æ]/g, 'ae')
      .replace(/[œ]/g, 'oe');
  }


  constructor (private _seriesService: SeriesService,
               private _filterService: FilterService,
               private route: ActivatedRoute) {

  }

  //noinspection JSUnusedGlobalSymbols
  ngOnInit () {

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
    this._filterService.updateLimitTo(null);
    this._currentFilterSubscription = this._filterService.currentFilterObservable().subscribe(
      (filter: Filter) => {
        // console.log(filter);
        this.filter = filter;
        if (this.fullSeries) {
          this._fillSeries();
        }
      }
    );

    this._seriesService
        .getSeries()
        .then(series => {
          this.fullSeries = series;
          this._fillSeries();

        })
        .catch(err => {
          console.log(err);
        })
  }

  //noinspection JSUnusedGlobalSymbols
  ngAfterViewInit () {
    // if it's only a tag, scroll to top
    if (this.selectedId) {
      setTimeout(() => {
        document.querySelector('#scrollView').parentElement.scrollTop = 0;
      })
    }
  }

  //noinspection JSUnusedGlobalSymbols
  ngOnDestroy () {
    // console.log("ngOnDestroy");
    if (this._currentFilterSubscription) {
      this._currentFilterSubscription.unsubscribe();
    }
  }

  /**
   * fill the this.series list (slowly) with the filtered this.fullSeries list
   * @private
   */
  private _fillSeries () {
    if (!this.fullSeries || !this.filter) {
      return;
    }
    const _filterCount = (++this.filterCount);

    const tmpSeries = this._filterAndSortSeries();

    if (tmpSeries) {

      let cpt = 0;
      const STEP = 5;

      // if series list exists already, start from books length
      if (this.series) {
        cpt = Math.min(
            Math.ceil(this.series.length / STEP),
            Math.floor(tmpSeries.length / STEP)) + 1;
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
          },
          100 * (cpt - initCpt));

        cpt++;
      }
    }

  }

  /**
   * Filter and sort the this.fullSeries list with the this.filter
   * @returns {Series[]} or null is nothing to do
   * @private
   */
  _filterAndSortSeries (): Series[] {
    const filterJson = JSON.stringify(this.filter);
    if ((this.previousFilterJson === filterJson) && (this.series != null)) {
      return null;
    }
    this.previousFilterJson = filterJson;

    // first filter
    const filteredSeries = this.fullSeries
                               .filter((s: Series) => {

                                 const strToSearch = s.series_name
                                                      .concat(s.author_name.toString())
                                                      .concat(s.books.reduce((p, c) => {
                                                        return p + c;
                                                      }, ''));

                                 return (SeriesListComponent._cleanAccent(strToSearch).includes(SeriesListComponent._cleanAccent(this.filter.search)));
                               })
                               .sort((b1: Series, b2: Series) => {
                                 let v1: string;
                                 let v2: string;
                                 v1 = b1.series_sort;
                                 v2 = b2.series_sort;
                                 switch (this.filter.sort) {
                                   case SortType.Name:
                                     break;
                                   case SortType.Author: {
                                     let v1Lst = b1.author_sort.concat();
                                     let v2Lst = b2.author_sort.concat();
                                     if (this.filter.sorting_direction === SortingDirection.Desc) {
                                       v1Lst.reverse();
                                       v2Lst.reverse();
                                     }
                                     v1 = v1Lst.toString() + ' ' + v1;
                                     v2 = v2Lst.toString() + ' ' + v2;
                                   }
                                     break;
                                   case SortType.PublishDate:
                                   default: {
                                     let v1Lst = b1.book_date.concat();
                                     let v2Lst = b2.book_date.concat();
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
    return filteredSeries
      .filter((b, i) => {
        return i < this.MAX_SERIES;
      });
  }

}


@NgModule({
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatContentModule,
    SeriesCardModule,
    TranslateModule
  ],
  declarations: [
    SeriesListComponent,
  ],
  exports: [
    SeriesListComponent
  ]
})
export class SeriesListModule {
}
