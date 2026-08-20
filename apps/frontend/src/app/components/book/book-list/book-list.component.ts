// <reference path="../../../../../node_modules/@angular/material/core/core.d.ts"/>
import { CommonModule } from '@angular/common';
import { Component, NgModule, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Book } from '@my-calibre-server/api-interfaces';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Filter, FilterService, LangAvailable, sortLabelKey, SortingDirection, SortType } from '../../filter-bar/filter.service';
import { matchesSearch } from '../../filter-bar/search-util';
import { FilterBarModule } from '../../filter-bar/filter-bar.component';
import { BookCardModule } from '../book-card/book-card.component';
import { BookService } from '../book.service';
import { NotificationService } from '../../notification/notification.service';

// const leftPad = require('left-pad');

@Component({
  selector: 'my-calibre-server-book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class BookListComponent implements OnInit, OnDestroy {
  MAX_BOOK = 200;
  param = {
    max: this.MAX_BOOK,
    totalCount: this.MAX_BOOK,
  };

  books: Book[] = [];
  fullBooks: Book[] = [];

  totalBooksCount = 0;
  loaded = false;

  filter: Filter = new Filter();
  private previousFilterJson = '';
  filterCount = 0;

  private _currentFilterSubscription: Subscription | undefined;

  constructor(
    private _bookService: BookService,
    private _filterService: FilterService,
    private _notificationService: NotificationService,
    private _translateService: TranslateService
  ) {
    while (this.books.length < this.MAX_BOOK) {
      this.books.push(new Book());
    }
  }

  get isFiltering(): boolean {
    return !!this.filter.search.trim() || this.filter.lang !== LangAvailable.All;
  }

  get subtitle(): string {
    if (this.isFiltering) {
      return this._translateService.instant('label.library-subtitle-filtered', { count: this.totalBooksCount });
    }
    const sortLabel = this._translateService.instant(sortLabelKey(this.filter.sort)).toLowerCase();
    return this._translateService.instant('label.library-subtitle', { count: this.totalBooksCount, sort: sortLabel });
  }

  //noinspection JSUnusedGlobalSymbols
  ngOnInit() {
    this._filterService.updateNotDisplayed(false);
    this._filterService.updateLimitTo([]);
    this._currentFilterSubscription = this._filterService.currentFilterObservable().subscribe((filter: Filter) => {
      this.filter = filter;
      if (this.fullBooks) {
        this._fillBooks();
      }
    });

    this._bookService
      .getBooks()
      .then((books) => {
        this.fullBooks = books;
        this.loaded = true;
        this._fillBooks();
      })
      .catch((err) => {
        console.log(err);
        this._notificationService.error(err);
      });
  }

  //noinspection JSUnusedGlobalSymbols
  ngOnDestroy() {
    // console.log("ngOnDestroy");
    if (this._currentFilterSubscription) {
      this._currentFilterSubscription.unsubscribe();
    }
  }

  /**
   * fill the this.book list (slowly) with the filtered this.fullBooks list
   * @private
   */
  private _fillBooks() {
    if (!this.fullBooks || !this.filter) {
      return;
    }
    const _filterCount = ++this.filterCount;

    const tmpBooks = this._filterAndSortBooks();

    if (tmpBooks) {
      let cpt = 0;
      const STEP = 50;

      // if books exists already, start from books length
      if (this.books) {
        cpt = Math.min(Math.ceil(this.books.length / STEP), Math.floor(tmpBooks.length / STEP)) + 1;
      }
      const initCpt = cpt;

      while (cpt * STEP <= tmpBooks.length + STEP) {
        const _cpt = cpt + 1;
        setTimeout(() => {
          if (_filterCount === this.filterCount) {
            this._realyFillBook(
              tmpBooks.filter((b, i) => {
                return i < _cpt * STEP;
              })
            );
          }
        }, 100 * (cpt - initCpt));

        cpt++;
      }
    }
  }

  /**
   * Move the books to the this.books
   * @param books
   * @private
   */

  private _realyFillBook(books: Book[]) {
    books = books.map((b) => this._bookService.cloneBook(b));

    // Old version
    // this.books = books;

    // A try
    // this.books[i] = books[i];

    // The fastest ?
    books.forEach((b1, i) => {
      const b2 = this.books[i];

      if (b2?.book_id) {
        const book_title = b1.book_title;
        b1.book_title = b2.book_title;
        b2.book_title = book_title;

        const book_id = b1.book_id;
        b1.book_id = b2.book_id;
        b2.book_id = book_id;

        const book_sort = b1.book_sort;
        b1.book_sort = b2.book_sort;
        b2.book_sort = book_sort;

        const book_has_cover = b1.book_has_cover;
        b1.book_has_cover = b2.book_has_cover;
        b2.book_has_cover = book_has_cover;

        const lang_code = b1.lang_code;
        b1.lang_code = b2.lang_code;
        b2.lang_code = lang_code;

        const rating = b1.rating;
        b1.rating = b2.rating;
        b2.rating = rating;

        const readerRating = b1.readerRating;
        b1.readerRating = b2.readerRating;
        b2.readerRating = readerRating;

        const readerRatingCount = b1.readerRatingCount;
        b1.readerRatingCount = b2.readerRatingCount;
        b2.readerRatingCount = readerRatingCount;

        const series_name = b1.series_name;
        b1.series_name = b2.series_name;
        b2.series_name = series_name;

        const book_series_index = b1.book_series_index;
        b1.book_series_index = b2.book_series_index;
        b2.book_series_index = book_series_index;

        const book_date = b1.book_date;
        b1.book_date = b2.book_date;
        b2.book_date = book_date;

        const author_name = b1.author_name;
        b1.author_name = b2.author_name;
        b2.author_name = author_name;
      } else {
        this.books[i] = b1;
      }
    });

    while (this.books.length > books.length) {
      this.books.splice(-1, 1);
    }
    // setTimeout(() => {
    //   console.log('done ' + (Date.now() - timetime) + ' ms (' + this.books.length + ')');
    // });
  }

  /**
   * Filter and sort the this.fullBooks list with the this.filter
   * @returns {Book[]} or null is nothing to do
   * @private
   */
  _filterAndSortBooks(): Book[] {
    const filterJson = JSON.stringify(this.filter);

    if (this.previousFilterJson === filterJson && this.books != null && this.books.length === this.fullBooks.length) {
      return [];
    }
    this.previousFilterJson = filterJson;

    const filteredBooks = this.fullBooks
      // first filter on tillte, name, comment
      .filter((b) => {
        const strToSearch = b.book_title
          .concat(b.series_name)
          .concat(b.comment)
          .concat('' + b.author_name);

        return matchesSearch(strToSearch, this.filter.search);
      })
      // then filter on language
      .filter((b) => {
        return b.lang_code === LangAvailable[this.filter.lang].toLowerCase() || this.filter.lang === LangAvailable.All;
      })
      // then sort
      .sort((b1: Book, b2: Book) => {
        let v1: string;
        let v2: string;
        let r1 = '99';
        let r2 = '99';
        v1 = (b1.series_name == null ? '' : b1.series_sort + ' ') + (b1.series_name == null ? '' : (b1.book_series_index + '').padStart(6, '0') + ' ') + b1.book_sort;
        v2 = (b2.series_name == null ? '' : b2.series_sort + ' ') + (b2.series_name == null ? '' : (b2.book_series_index + '').padStart(6, '0') + ' ') + b2.book_sort;
        switch (this.filter.sort) {
          case SortType.Name:
            break;
          case SortType.Author:
            v1 = b1.author_sort.toString() + ' ' + v1;
            v2 = b2.author_sort.toString() + ' ' + v2;
            break;
          case SortType.PublicRating:
            r1 = '99';
            if (b1.rating) {
              r1 = '0' + (10 - +b1.rating);
              r1 = r1.substr(r1.length - 2);
            }
            v1 = r1 + ' ' + v1;
            r2 = '99';
            if (b2.rating) {
              r2 = '0' + (10 - +b2.rating);
              r2 = r2.substr(r2.length - 2);
            }
            v2 = r2 + ' ' + v2;
            break;
          case SortType.ReaderRating:
            r1 = '99';
            if (b1.readerRating) {
              r1 = '0' + (10 - +b1.readerRating);
              r1 = r1.substr(r1.length - 2);
            }
            v1 = r1 + ' ' + b1.readerRatingCount + ' ' + v1;
            r2 = '99';
            if (b2.readerRating) {
              r2 = '0' + (10 - +b2.readerRating);
              r2 = r2.substr(r2.length - 2);
            }
            v2 = r2 + ' ' + b2.readerRatingCount + ' ' + v2;
            break;
          case SortType.PublishDate:
          default:
            v1 = b1.book_date.toISOString() + ' ' + v1;
            v2 = b2.book_date.toISOString() + ' ' + v2;
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
    const result = filteredBooks.filter((b, i) => {
      return i < this.MAX_BOOK;
    });

    // timetime = Date.now();

    return result;
  }
}

// let timetime = Date.now();

@NgModule({
  imports: [
    FormsModule,
    CommonModule,
    MatProgressSpinnerModule,
    BookCardModule,
    FilterBarModule,
    TranslatePipe,
  ],
  declarations: [BookListComponent],
  exports: [BookListComponent],
})
export class BookListModule {}
