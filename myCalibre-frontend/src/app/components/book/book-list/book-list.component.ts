// <reference path="../../../../../node_modules/@angular/material/core/core.d.ts"/>
import {Component, NgModule, OnDestroy, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {Subscription} from 'rxjs';

import {Filter, FilterService, LangAvailable, SortingDirection, SortType} from '../../filter-bar/filter.service';
import {MatContentModule} from '../../content/content.component';
import {BookCardModule} from '../book-card/book-card.component';
import {BookService} from '../book.service';
import {Book} from '../book';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCommonModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import {TranslateModule} from '@ngx-translate/core';

const leftPad = require('left-pad');

@Component({
  selector: 'app-book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.scss']
})
export class BookListComponent implements OnInit, OnDestroy {

  MAX_BOOK = 200;
  param = {
    max: this.MAX_BOOK,
    totalCount: this.MAX_BOOK
  };

  books: Book[] = [];
  fullBooks: Book[];

  totalBooksCount = 0;

  filter: Filter;
  private previousFilterJson = '';
  filterCount = 0;

  private _currentFilterSubscription: Subscription;

  static _cleanAccent(str: string): string {
    return str.toLowerCase()
      .replace(/[àâªáäãåā]/g, 'a')
      .replace(/[èéêëęėē]/g, 'e')
      .replace(/[iïìíįī]/g, 'i')
      .replace(/[ôºöòóõøō]/g, 'o')
      .replace(/[ûùüúū]/g, 'u')
      .replace(/[æ]/g, 'ae')
      .replace(/[œ]/g, 'oe');
  }

  constructor(private _bookService: BookService,
              private _filterService: FilterService) {
    while (this.books.length < this.MAX_BOOK) {
      this.books.push(new Book());
    }
  }

  //noinspection JSUnusedGlobalSymbols
  ngOnInit() {

    this._filterService.updateNotDisplayed(false);
    this._filterService.updateLimitTo(null);
    this._currentFilterSubscription = this._filterService.currentFilterObservable().subscribe(
      (filter: Filter) => {
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
              this._realyFillBook(tmpBooks.filter((b, i) => {
                return i < _cpt * STEP;
              }));
            }
          },
          100 * (cpt - initCpt));

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

    // Old version
    // this.books = books;

    // A try
    // this.books[i] = books[i];

    // The fastest ?
    for (let i = 0; i < books.length; i++) {
      if (this.books[i] && this.books[i].book_id) {
        let book_title = this.books[i].book_title;
        this.books[i].book_title = books[i].book_title;
        books[i].book_title = book_title;

        let book_id = this.books[i].book_id;
        this.books[i].book_id = books[i].book_id;
        books[i].book_id = book_id;

        let book_sort = this.books[i].book_sort;
        this.books[i].book_sort = books[i].book_sort;
        books[i].book_sort = book_sort;

        let book_has_cover = this.books[i].book_has_cover;
        this.books[i].book_has_cover = books[i].book_has_cover;
        books[i].book_has_cover = book_has_cover;

        let lang_code = this.books[i].lang_code;
        this.books[i].lang_code = books[i].lang_code;
        books[i].lang_code = lang_code;

        let rating = this.books[i].rating;
        this.books[i].rating = books[i].rating;
        books[i].rating = rating;

        let readerRating = this.books[i].readerRating;
        this.books[i].readerRating = books[i].readerRating;
        books[i].readerRating = readerRating;

        let readerRatingCount = this.books[i].readerRatingCount;
        this.books[i].readerRatingCount = books[i].readerRatingCount;
        books[i].readerRatingCount = readerRatingCount;

        let series_name = this.books[i].series_name;
        this.books[i].series_name = books[i].series_name;
        books[i].series_name = series_name;

        let book_series_index = this.books[i].book_series_index;
        this.books[i].book_series_index = books[i].book_series_index;
        books[i].book_series_index = book_series_index;

        let book_date = this.books[i].book_date;
        this.books[i].book_date = books[i].book_date;
        books[i].book_date = book_date;

        let author_name = this.books[i].author_name;
        this.books[i].author_name = books[i].author_name;
        books[i].author_name = author_name;
      } else {
        this.books[i] = books[i];
      }
    }

    while (this.books.length > books.length) {
      this.books.splice(-1, 1);
    }

    setTimeout(() => {
      console.log('done ' + (Date.now() - timetime) + ' ms (' + this.books.length + ')');
    })
  }


  /**
   * Filter and sort the this.fullBooks list with the this.filter
   * @returns {Book[]} or null is nothing to do
   * @private
   */
  _filterAndSortBooks(): Book[] {
    const filterJson = JSON.stringify(this.filter);
    if ((this.previousFilterJson === filterJson) && (this.books != null)) {
      return null;
    }
    this.previousFilterJson = filterJson;

    const filteredBooks = this.fullBooks
    // first filter on tillte, name, comment
      .filter((b) => {

        const strToSearch = b.book_title
          .concat(b.series_name)
          .concat(b.comment)
          .concat('' + b.author_name);

        return (BookListComponent._cleanAccent(strToSearch).includes(BookListComponent._cleanAccent(this.filter.search.trim())));
      })
      // then filter on language
      .filter((b) => {
        return (b.lang_code === LangAvailable[this.filter.lang].toLowerCase()) || (this.filter.lang === LangAvailable.All)
      })
      // then sort
      .sort((b1: Book, b2: Book) => {
        let v1: string;
        let v2: string;
        let r1 = '99';
        let r2 = '99';
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
            r1 = '99';
            if (b1.rating) {
              r1 = ('0' + (10 - +b1.rating));
              r1 = r1.substr(r1.length - 2);
            }
            v1 = r1 + ' ' + v1;
            r2 = '99';
            if (b2.rating) {
              r2 = ('0' + (10 - +b2.rating));
              r2 = r2.substr(r2.length - 2);
            }
            v2 = r2 + ' ' + v2;
            break;
          case SortType.ReaderRating:
            r1 = '99';
            if (b1.readerRating) {
              r1 = ('0' + (10 - +b1.readerRating));
              r1 = r1.substr(r1.length - 2);
            }
            v1 = r1 + ' ' + b1.readerRatingCount + ' ' + v1;
            r2 = '99';
            if (b2.readerRating) {
              r2 = ('0' + (10 - +b2.readerRating));
              r2 = r2.substr(r2.length - 2);
            }
            v2 = r2 + ' ' + b2.readerRatingCount + ' ' + v2;
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
    let result = filteredBooks
      .filter((b, i) => {
        return i < this.MAX_BOOK;
      });

    timetime = Date.now();

    return result;
  }

}

let timetime = Date.now();


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
export class BookListModule {
}
