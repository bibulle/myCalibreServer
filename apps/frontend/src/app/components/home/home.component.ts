import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Book } from '@my-calibre-server/api-interfaces';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LocalizedDateModule } from '../../directives/localized-date.pipe';
import { ImageSpritesModule } from '../image-sprites/image-sprites.component';
import { BookService } from '../book/book.service';
import { Filter, FilterService } from '../filter-bar/filter.service';
import { NotificationService } from '../notification/notification.service';

export enum NewsGroupType {
  Today,
  ThisWeek,
  Earlier,
}

export class NewsGroup {
  type: NewsGroupType = NewsGroupType.Today;
  books: Book[] = [];
}

@Component({
    selector: 'my-calibre-server-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: false
})
export class HomeComponent implements OnInit {

  BOOKS_LIMIT = 200;

  groups: NewsGroup[] = [];

  NewsGroupType = NewsGroupType;

  constructor(private _bookService: BookService,
              private _notificationService: NotificationService,
              private _filterService: FilterService,
              private _translateService: TranslateService,
              private _router: Router) { }

  ngOnInit() {
    this._filterService.update(new Filter({not_displayed: true}));

    this._bookService
        .getNewBooks()
        .then(books => {
          this.groups = this.groupBooks(books);
        })
        .catch(err => {
          console.log(err);
          this._notificationService.error(err);
        })

  }

  openBook(bookId: number) {
    this._router.navigate(['/book', bookId]);
  }

  groupLabel(type: NewsGroupType): string {
    switch (type) {
      case NewsGroupType.Today:
        return this._translateService.instant('label.news-today');
      case NewsGroupType.ThisWeek:
        return this._translateService.instant('label.news-this-week');
      default:
        return this._translateService.instant('label.news-earlier');
    }
  }

  /**
   * The date a book was added to the library. `timestamp` is the intended
   * field, but some libraries only carry `last_modified` - fall back to it
   * rather than showing an invalid date.
   */
  addedDate(book: Book): Date {
    const timestamp = new Date(book.timestamp);
    if (!isNaN(timestamp.getTime())) {
      return timestamp;
    }

    const lastModified = new Date(book.last_modified);
    if (!isNaN(lastModified.getTime())) {
      return lastModified;
    }

    return new Date();
  }

  /**
   * Number of whole days between the book's added date and today (0 = today, 1 = yesterday, ...).
   */
  daysSinceAdded(book: Book): number {
    const addedDay = this.addedDate(book);
    addedDay.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Math.round((today.getTime() - addedDay.getTime()) / (24 * 60 * 60 * 1000));
  }

  private groupBooks(books: Book[]): NewsGroup[] {
    const groups: NewsGroup[] = [
      { type: NewsGroupType.Today, books: [] },
      { type: NewsGroupType.ThisWeek, books: [] },
      { type: NewsGroupType.Earlier, books: [] },
    ];

    books.forEach(book => {
      const days = this.daysSinceAdded(book);
      if (days <= 0) {
        groups[0].books.push(book);
      } else if (days <= 6) {
        groups[1].books.push(book);
      } else {
        groups[2].books.push(book);
      }
    });

    return groups.filter(group => group.books.length > 0);
  }

}

@NgModule({
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    LocalizedDateModule,
    ImageSpritesModule
  ],
  declarations: [HomeComponent],
  exports: [HomeComponent]
})
export class HomeModule { }
