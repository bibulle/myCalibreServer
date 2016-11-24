import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { BookService } from "../book.service";
import { Book } from "../book";

@Component({
  selector: 'app-book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.scss']
})
export class BookListComponent implements OnInit {

  MAX_BOOK = 1000;

  books: Book[];

  totalBooksCount = 0;

  filter= {};

  constructor (private _bookService: BookService,) {

  }

  ngOnInit () {
    this._bookService
        .getBooks()
        .then(books => {
          var tmpBooks = this._filterAndSortBooks(books);

          var cpt = 1;
          var STEP = 50;
          while(cpt * STEP <= tmpBooks.length+STEP) {
            const _cpt = cpt;
            setTimeout(() => {
              //console.log(" "+_cpt);
              this.books = tmpBooks.filter((b, i) => {
                return i < _cpt*STEP;
              });
            },
            200 * cpt);

            cpt++;
          }

        })
        .catch(err => {
          console.log(err);
        })
  }

  _filterAndSortBooks(books): Book[] {
    this.totalBooksCount = books.length;
    return books
      .filter((b, i) => {
        return i < this.MAX_BOOK;
      });
  }

}
