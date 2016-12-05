///<reference path="../../../../../node_modules/@angular/material/core/core.d.ts"/>
import { Component, OnInit, NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

const leftPad = require('left-pad');

import { FilterService, Filter, SortType, SortingDirection } from "../../filter-bar/filter.service";
import { MdContentModule } from "../../content/content.component";
import { BookCardModule } from "../book-card/book-card.component";
import { BookService } from "../book.service";
import { Book } from "../book";
import { MdCoreModule, MdCardModule, MdButtonModule, MdIconModule, MdInputModule, MdProgressCircleModule, MdToolbarModule } from "@angular/material";

@Component({
  selector: 'app-book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.scss']
})
export class BookListComponent implements OnInit {

  MAX_BOOK = 500;

  books: Book[];
  fullBooks: Book[];

  totalBooksCount = 0;

  filter: Filter = new Filter();
  private previousFilterJson: string = "";
  filterCount = 0;

  constructor (private _bookService: BookService,
               private _filterService: FilterService) {

  }

  //noinspection JSUnusedGlobalSymbols
  ngOnInit () {

    this._filterService.update(this.filter);
    this._filterService.currentFilterObservable().subscribe(
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

  /**
   * fill the this.book list (slowly) with the filtered this.fullBooks list
   * @private
   */
  private _fillBooks () {
    const _filterCount = (++this.filterCount);

    var tmpBooks = this._filterAndSortBooks();

    if (tmpBooks) {

      var cpt = 0;
      var STEP = 50;

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
            if (_filterCount == this.filterCount) {
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
    var filterJson = JSON.stringify(this.filter);
    if ((this.previousFilterJson === filterJson) && (this.books != null)) {
      return null;
    }
    this.previousFilterJson = filterJson;

    // first filter
    var filteredBooks = this.fullBooks
                            .filter((b) => {

                              var strToSearch = b.book_title
                                                 .concat(b.series_name)
                                                 .concat(b.comment)
                                                 .concat("" + b.author_name);

                              var ret = (BookListComponent._cleanAccent(strToSearch).includes(BookListComponent._cleanAccent(this.filter.search)));

                              return ret;
                            })
                            .sort((b1: Book, b2: Book) => {
                              var v1: string;
                              var v2: string;
                              v1 = (b1.series_name == null ? "" : b1.series_sort + " ") + (b1.series_name == null ? "" : leftPad(b1.book_series_index, 6, 0) + " ") + b1.book_sort;
                              v2 = (b2.series_name == null ? "" : b2.series_sort + " ") + (b2.series_name == null ? "" : leftPad(b2.book_series_index, 6, 0) + " ") + b2.book_sort;
                              switch (this.filter.sort) {
                                case SortType.Name:
                                  break;
                                case SortType.Author:
                                  v1 = b1.author_sort.toString() + " " + v1;
                                  v2 = b2.author_sort.toString() + " " + v2;
                                  break;
                                case SortType.PublishDate:
                                default:
                                  v1 = b1.book_date + " " + v1;
                                  v2 = b2.book_date + " " + v2;
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

    // then sort (TODO)

    this.totalBooksCount = filteredBooks.length;

    // then limit size
    return filteredBooks
      .filter((b, i) => {
        return i < this.MAX_BOOK;
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
    FormsModule,
    MdCoreModule,
    CommonModule,
    MdCardModule,
    MdButtonModule,
    MdIconModule.forRoot(),
    MdInputModule,
    MdProgressCircleModule,
    MdContentModule,
    MdToolbarModule,
    BookCardModule,
    // MdInputModule,
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
