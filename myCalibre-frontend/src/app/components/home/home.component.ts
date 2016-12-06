import { Component, OnInit, NgModule } from '@angular/core';
import { FilterService, Filter } from "../filter-bar/filter.service";
import { BookService } from "../book/book.service";
import { Book } from "../book/book";
import { CommonModule } from "@angular/common";
import { BookCardModule } from "../book/book-card/book-card.component";
import { MdContentModule } from "../content/content.component";
import { MdProgressCircleModule, MdCardModule } from "@angular/material";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  books: Book[];

  BOOKS_LIMIT = 20;

  constructor(private _bookService: BookService,
              private _filterService: FilterService) { }

  ngOnInit() {
    this._filterService.update(new Filter({not_displayed: true}));

    this._bookService
        .getNewBooks(this.BOOKS_LIMIT)
        .then(books => {
          this.books = books;
        })
        .catch(err => {
          console.log(err);
        })

  }

}

@NgModule({
  imports: [
    CommonModule,
    MdContentModule,
    MdProgressCircleModule,
    MdCardModule,
    BookCardModule,
  ],
  declarations: [HomeComponent],
  exports: [HomeComponent]
})
export class HomeModule { }