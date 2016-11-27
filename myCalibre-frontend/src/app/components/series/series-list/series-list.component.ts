import { Component, OnInit, NgModule } from '@angular/core';
import { Series } from "../series";
import { Filter, FilterService } from "../../filter-bar/filter.service";
import { SeriesService } from "../series.service";
import { CommonModule } from "@angular/common";
import { MdContentModule } from "../../content/content.component";
import { MdProgressCircleModule } from "@angular2-material/progress-circle";
import { SeriesCardComponent, SeriesCardModule } from "../series-card/series-card.component";

@Component({
  selector: 'app-series-list',
  templateUrl: './series-list.component.html',
  styleUrls: ['./series-list.component.scss']
})
export class SeriesListComponent implements OnInit {

  MAX_SERIES = 100;

  series: Series[];
  fullSeries: Series[];

  totalSereisCount = 0;

  filter: Filter = new Filter();
  private previousFilterJson: string = "";
  filterCount = 0;

  constructor (private _seriesService: SeriesService,
               private _filterService: FilterService) {

  }

  //noinspection JSUnusedGlobalSymbols
  ngOnInit() {
    this._filterService.update(this.filter);
    this._filterService.currentFilterObservable().subscribe(
      (filter: Filter) => {
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

  /**
   * fill the this.series list (slowly) with the filtered this.fullSeries list
   * @private
   */
  private _fillSeries () {
    const _filterCount = (++this.filterCount);

    var tmpSeries = this._filterAndSortSeries();

    if (tmpSeries) {

      var cpt = 0;
      var STEP = 5;

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
            if (_filterCount == this.filterCount) {
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
    var filterJson = JSON.stringify(this.filter);
    if ((this.previousFilterJson === filterJson) && (this.series != null)) {
      return null;
    }
    this.previousFilterJson = filterJson;

    // first filter
    var filteredSeries = this.fullSeries
                            .filter((b) => {

//                              var strToSearch = b.book_title
//                                                 .concat(b.series_name)
//                                                 .concat(b.comment)
//                                                 .concat("" + b.author_name);
//
//                              var ret = (BookListComponent._cleanAccent(strToSearch).includes(BookListComponent._cleanAccent(this.filter.search)));
//
//                              return ret;
                              return true;
                            })
                            .sort((b1: Series, b2: Series) => {
//                              var v1: string;
//                              var v2: string;
//                              v1 = (b1.series_name == null ? "" : b1.series_sort + " ") + (b1.series_name == null ? "" : leftPad(b1.book_series_index, 6, 0) + " ") + b1.book_sort;
//                              v2 = (b2.series_name == null ? "" : b2.series_sort + " ") + (b2.series_name == null ? "" : leftPad(b2.book_series_index, 6, 0) + " ") + b2.book_sort;
//                              switch (this.filter.sort) {
//                                case SortType.Name:
//                                  break;
//                                case SortType.Author:
//                                  v1 = b1.author_sort.toString() + " " + v1;
//                                  v2 = b2.author_sort.toString() + " " + v2;
//                                  break;
//                                case SortType.PublishDate:
//                                default:
//                                  v1 = b1.book_date + " " + v1;
//                                  v2 = b2.book_date + " " + v2;
//                                  break;
//                              }
//
//                              switch (this.filter.sorting_direction) {
//                                case SortingDirection.Asc:
//                                  return v1.localeCompare(v2);
//                                case SortingDirection.Desc:
//                                default:
//                                  return v2.localeCompare(v1);
//                              }
                              return 0;

                            });

    this.totalSereisCount = filteredSeries.length;

    // then limit size
    return filteredSeries
      .filter((b, i) => {
        return i < this.MAX_SERIES;
      });
  }

  static _cleanAccent (str: string): string {
    return str.toLowerCase()
              .replace(/[àâªáäãåā]/g, "a")
              .replace(/[èéêëęėē]/g, "e")
              .replace(/[iïìíįī]/g, "i")
              .replace(/[ôºöòóõøō]/g, "o")
              .replace(/[ûùüúū]/g, "u")
              .replace(/[æ]/g, "ae")
              .replace(/[œ]/g, "oe");
  }


}


@NgModule({
  imports: [
    CommonModule,
    MdProgressCircleModule,
    MdContentModule,
    SeriesCardModule,
  ],
  declarations: [
    SeriesListComponent,
  ],
  exports: [
    SeriesListComponent
  ]
})
export class SeriesListModule { }
