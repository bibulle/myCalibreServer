import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Book } from '@my-calibre-server/api-interfaces';
import { TranslateModule } from '@ngx-translate/core';
import { BookCardModule } from '../book/book-card/book-card.component';
import { BookService } from '../book/book.service';
import { MatContentModule } from '../content/content.component';
import { Filter, FilterService } from '../filter-bar/filter.service';
import { NotificationService } from '../notification/notification.service';

@Component({
  selector: 'my-calibre-server-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  books: Book[] = [];

  BOOKS_LIMIT = 200;
  param = {
    BOOKS_LIMIT: this.BOOKS_LIMIT
  };

  constructor(private _bookService: BookService,
              private _notificationService: NotificationService,
              private _filterService: FilterService) { }

  ngOnInit() {
    this._filterService.update(new Filter({not_displayed: true}));

    this._bookService
        .getNewBooks()
        .then(books => {
          this.books = books;
        })
        .catch(err => {
          console.log(err);
          this._notificationService.error(err);
        })

  }

}

@NgModule({
  imports: [
    CommonModule,
    MatContentModule,
    MatProgressSpinnerModule,
    MatCardModule,
    BookCardModule,
    TranslateModule
  ],
  declarations: [HomeComponent],
  exports: [HomeComponent]
})
export class HomeModule { }
