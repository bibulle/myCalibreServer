import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { BookService } from "../book.service";
import { Book } from "../book";
import { FilterService, Filter, SortType, SortingDirection } from "../../filter-bar/filter.service";

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
      var initCpt = cpt;

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
                            .filter((b, i) => {

                              var strToSearch = b.book_title
                                                 .concat(b.series_name)
                                                 .concat(b.comment)
                                                 .concat("" + b.author_name);

                              var ret = (this._cleanAccent(strToSearch).includes(this._cleanAccent(this.filter.search)));

                              return ret;
                            })
                            .sort((b1, b2) => {
                              var v1: string;
                              var v2: string;
                              switch (this.filter.sort) {
                                case SortType.Name:
                                  v1 = b1.book_sort;
                                  v2 = b2.book_sort;
                                  break;
                                case SortType.Author:
                                  v1 = b1.author_sort.toString();
                                  v2 = b2.author_sort.toString();
                                  break;
                                case SortType.PublishDate:
                                default:
                                  v1 = b1.book_date;
                                  v2 = b2.book_date;
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

  _cleanAccent (str: string): string {
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
