// <reference path="../../../../../node_modules/@angular/material/core/core.d.ts"/>
import {Component, OnInit, NgModule, OnDestroy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

const leftPad = require('left-pad');
import { Subscription } from 'rxjs';

import { FilterService, Filter, SortType, SortingDirection } from '../../filter-bar/filter.service';
import { MatContentModule } from '../../content/content.component';
import { BookCardModule } from '../book-card/book-card.component';
import { BookService } from '../book.service';
import { Book } from '../book';
import { MatCommonModule, MatCardModule, MatButtonModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatToolbarModule } from '@angular/material';
import {TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.scss']
})
export class BookListComponent implements OnInit, OnDestroy {

  MAX_BOOK = 500;
  param = {
    max: this.MAX_BOOK,
    totalCount: this.MAX_BOOK
  };

  books: Book[];
  fullBooks: Book[];

  totalBooksCount = 0;

  filter: Filter;
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

  constructor (private _bookService: BookService,
               private _filterService: FilterService) {

  }

  //noinspection JSUnusedGlobalSymbols
  ngOnInit () {

    this._filterService.updateNotDisplayed(false);
    this._filterService.updateLimitTo(null);
    this._currentFilterSubscription = this._filterService.currentFilterObservable().subscribe(
      (filter: Filter) => {
        // console.log(filter);
        this.filter = filter;
        if (this.fullBooks) {
          this._fillBooks();
        }
      }
    );

    this._bookService
        .getBooks()
        .then(books => {
          this.fullBooks = books;
          this._fillBooks();

        })
        .catch(err => {
          console.log(err);
        })
  }

  //noinspection JSUnusedGlobalSymbols
  ngOnDestroy () {
    // console.log("ngOnDestroy");
    if (this._currentFilterSubscription) {
      this._currentFilterSubscription.unsubscribe();
    }
  }

  /**
   * fill the this.book list (slowly) with the filtered this.fullBooks list
   * @private
   */
  private _fillBooks () {
    if (!this.fullBooks || !this.filter) {
      return;
    }
    const _filterCount = (++this.filterCount);

    const tmpBooks = this._filterAndSortBooks();

    if (tmpBooks) {

      let cpt = 0;
      const STEP = 50;

      // if books exists already, start from books length
      if (this.books) {
        cpt = Math.min(
            Math.ceil(this.books.length / STEP),
            Math.floor(tmpBooks.length / STEP)) + 1;
      }
      const initCpt = cpt;

      while (cpt * STEP <= tmpBooks.length + STEP) {
        const _cpt = cpt + 1;
        setTimeout(() => {
            if (_filterCount === this.filterCount) {
              this.books = tmpBooks.filter((b, i) => {
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
   * Filter and sort the this.fullBooks list with the this.filter
   * @returns {Book[]} or null is nothing to do
   * @private
   */
  _filterAndSortBooks (): Book[] {
    const filterJson = JSON.stringify(this.filter);
    if ((this.previousFilterJson === filterJson) && (this.books != null)) {
      return null;
    }
    this.previousFilterJson = filterJson;

    const filteredBooks = this.fullBooks
                              // first filter
                              .filter((b) => {

                                const strToSearch = b.book_title
                                                     .concat(b.series_name)
                                                     .concat(b.comment)
                                                     .concat('' + b.author_name);

                                return (BookListComponent._cleanAccent(strToSearch).includes(BookListComponent._cleanAccent(this.filter.search)));
                              })
                              // then sort
                              .sort((b1: Book, b2: Book) => {
                                let v1: string;
                                let v2: string;
                                v1 = (b1.series_name == null ? '' : b1.series_sort + ' ') + (b1.series_name == null ? '' : leftPad(b1.book_series_index, 6, 0) + ' ') + b1.book_sort;
                                v2 = (b2.series_name == null ? '' : b2.series_sort + ' ') + (b2.series_name == null ? '' : leftPad(b2.book_series_index, 6, 0) + ' ') + b2.book_sort;
                                switch (this.filter.sort) {
                                  case SortType.Name:
                                    break;
                                  case SortType.Author:
                                    v1 = b1.author_sort.toString() + ' ' + v1;
                                    v2 = b2.author_sort.toString() + ' ' + v2;
                                    break;
                                  case SortType.PublicRating:
                                    v1 = b1.rating + ' ' + v1;
                                    v2 = b2.rating + ' ' + v2;
                                    break;
                                  case SortType.PublishDate:
                                  default:
                                    v1 = b1.book_date + ' ' + v1;
                                    v2 = b2.book_date + ' ' + v2;
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


    this.totalBooksCount = filteredBooks.length;
    this.param.totalCount = this.totalBooksCount;

    // then limit size
    return filteredBooks
      .filter((b, i) => {
        return i < this.MAX_BOOK;
      });
  }

}

@NgModule({
  imports: [
    FormsModule,
    MatCommonModule,
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatContentModule,
    MatToolbarModule,
    BookCardModule,
    TranslateModule,
    // MatInputModule,
    // FlexModule,
    // ScrollDetectorModule,
  ],
  declarations: [
    BookListComponent,
  ],
  exports: [
    BookListComponent
  ]
})
export class BookListModule { }
