import { CommonModule } from '@angular/common';
import { Component, Input, NgModule, ChangeDetectionStrategy } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Book, BookFormat, preferredBookFormat } from '@my-calibre-server/api-interfaces';
import { TranslatePipe } from '@ngx-translate/core';
import { ImageSpritesModule } from '../../image-sprites/image-sprites.component';
import { UserService } from '../../authent/user.service';
import { NotificationService } from '../../notification/notification.service';
import { BookService } from '../book.service';
import { triggerBrowserDownload } from '../download-util';

@Component({
    selector: 'my-calibre-server-book-card',
    templateUrl: './book-card.component.html',
    styleUrls: ['./book-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BookCardComponent {

  @Input()
  book: Book = new Book();

  @Input()
  index = -1;

  thumbnailUrlBase = `/api/book/thumbnail`;


  constructor (private router: Router,
               private _bookService: BookService,
               private _userService: UserService,
               private _notificationService: NotificationService) { }

  // ngOnInit () {
  //   console.log(`${typeof this.book.book_date} ${this.book.book_date}`);
  //   console.log(new Date(1900, 0, 1).getTime());
  // }

  /**
   * A book has been clicked
   * @param event
   */
  openBook(event: Event) {
    event.stopPropagation();
    this.router.navigate(['/book', this.book.book_id]);
  }

  /** Format the quick download would fetch, or undefined when there is none. */
  get downloadFormat(): BookFormat | undefined {
    return preferredBookFormat(this.book.data);
  }

  /**
   * Quick-download the book in its best available format straight from the
   * list card. The full format/Kindle picker stays on the book detail page.
   */
  download(event: Event) {
    event.stopPropagation();

    const format = this.downloadFormat;
    if (!format) {
      return;
    }

    this._bookService
      .getDownloadUrl(this.book.book_id, format)
      .then((url) => {
        triggerBrowserDownload(url);
        setTimeout(() => {
          this._userService.refreshUser().catch((err) => {
            console.log(err);
          });
        }, 3000);
      })
      .catch((err) => {
        console.log(err);
        this._notificationService.error(err);
      });
  }

}


@NgModule({
  imports: [
    CommonModule,
    MatTooltipModule,
    TranslatePipe,
    ImageSpritesModule
  ],
  declarations: [
    BookCardComponent
  ],
  exports: [
    BookCardComponent
  ]
})
export class BookCardModule {
}
