import { Component, NgModule, OnInit } from '@angular/core';
import { FilterService } from '../../filter-bar/filter.service';
import { Book, ReaderRatingTotal } from '@my-calibre-server/api-interfaces';
import { ActivatedRoute, Router } from '@angular/router';
import { BookService } from '../book.service';
import { MatContentModule } from '../../content/content.component';
import { CommonModule } from '@angular/common';
import { TitleService } from '../../../app/title.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { KindleDialogComponent, KindleDialogReturn } from './kindle-dialog/kindle-dialog.component';
import { NotificationService } from '../../notification/notification.service';
import { FlexLayoutModule } from '@angular/flex-layout';
import { LocalizedDateModule } from '../../../directives/localized-date.pipe';
import { MatRatingModule } from '../../rating/rating.component';
import { UserService } from '../../authent/user.service';

@Component({
  selector: 'my-calibre-server-book-page',
  templateUrl: './book-page.component.html',
  styleUrls: ['./book-page.component.scss'],
})
export class BookPageComponent implements OnInit {
  // filter: Filter;

  book: Book = new Book();

  bookHasEpub = false;
  bookHasMobi = false;
  ratings: ReaderRatingTotal = new ReaderRatingTotal();

  coverUrlBase = `/api/book/cover`;

  constructor(
    private _filterService: FilterService,
    private _titleService: TitleService,
    private _bookService: BookService,
    private _route: ActivatedRoute,
    private _router: Router,
    private _dialog: MatDialog,
    private _notificationService: NotificationService,
    private _userService: UserService,
    private _translateService: TranslateService
  ) {}

  ngOnInit() {
    this._filterService.updateNotDisplayed(true);

    const id = this._route.snapshot.params['id'];

    this._bookService
      .getBook(id)
      .then((book) => {
        // console.log(book);
        this.book = book;

        this.book.data.forEach((bd) => {
          if (bd.data_format === 'EPUB') {
            this.bookHasEpub = true;
          } else if (bd.data_format === 'MOBI') {
            this.bookHasMobi = true;
          }
        });

        this.ratings = this._bookService.updateReaderRating(this.book, this._userService.getUser());

        // console.log(book);

        this._titleService.forceTitle(this._router.url, book.book_title);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  ratingUpdated(rating: number) {
    // console.log('RATING : ' + rating);
    this.ratings.yourRating = rating * 2;

    this._bookService
      .updateRating(this.book.book_id, rating * 2)
      .then((result) => {
        setTimeout(() => {
          this._userService
            .refreshUser()
            .then(() => {
              // console.log(this._userService.getUser());
              this.ratings = this._bookService.updateReaderRating(this.book, this._userService.getUser());
            })
            .catch((err) => {
              console.log(err);
            });
        }, 3000);

        switch (result) {
          case 'CHANGED':
            this._notificationService.info(this._translateService.instant('label.rating.changed'));
            break;
          case 'NOTHING_TO_DO':
            this._notificationService.info(this._translateService.instant('label.rating.nothing'));
            break;
          default:
          case 'SAVED':
            this._notificationService.info(this._translateService.instant('label.rating.saved'));
            break;
        }
      })
      .catch((err) => {
        console.log(err);
        this._notificationService.error(err.statusText);
      });
  }

  /**
   * An author has been clicked
   * @param author_id
   * @param author_name
   */
  openAuthor(event: Event, author_id: number, author_name: string) {
    event.stopPropagation();
    //noinspection JSIgnoredPromiseFromCall
    this._router.navigate(['/authors'], { queryParams: { id: author_id, name: author_name } });
  }

  /**
   * A tag has been clicked
   * @param tag_id
   * @param tag_name
   */
  openTag(event: Event, tag_id: number, tag_name: string) {
    event.stopPropagation();
    //noinspection JSIgnoredPromiseFromCall
    this._router.navigate(['/tags'], { queryParams: { id: tag_id, name: tag_name } });
  }

  /**
   * A series has been clicked
   * @param series_id
   * @param series_name
   */
  openSeries(event: Event, series_id: string, series_name: string) {
    event.stopPropagation();
    //noinspection JSIgnoredPromiseFromCall
    this._router.navigate(['/series'], { queryParams: { id: series_id, name: series_name } });
  }

  /** Open send to kindle dialog
   *
   */
  openDialog() {
    const dialogRef = this._dialog.open(KindleDialogComponent, {});

    dialogRef.afterClosed().subscribe((ret: KindleDialogReturn) => {
      // console.log(`Book page '${ret.mail}' '${ret.format}'`);
      // if there is an email
      if (ret.mail && ret.format) {
        this._bookService
          .sendKindle(this.book.book_id, ret.mail, ret.format)
          .then(() => {
            setTimeout(() => {
              this._userService.refreshUser().catch((err) => {
                console.log(err);
              });
            }, 3000);
            this._notificationService.info('Book sent');
          })
          .catch((err) => {
            console.log(err);
            this._notificationService.error(err.statusText);
          });
      }
    });
  }

  /**
   * Methode to download an epub
   */
  downloadEpub() {
    this._bookService
      .getEpubUrl(this.book.book_id)
      .then((url) => {
        const link = document.createElement('a');

        link.setAttribute('href', url);
        // link.setAttribute('download', this.book.book_id+'.epub');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => {
          this._userService.refreshUser().catch((err) => {
            console.log(err);
          });
        }, 3000);
      })
      .catch((err) => {
        console.log(err);
        this._notificationService.error(err.statusText);
      });
  }

  /**
   * Methode to download an epub
   */
  downloadMobi() {
    this._bookService
      .getMobiUrl(this.book.book_id)
      .then((url) => {
        const link = document.createElement('a');

        link.setAttribute('href', url);
        // link.setAttribute('download', this.book.book_id+'.mobi');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => {
          this._userService.refreshUser().catch((err) => {
            console.log(err);
          });
        }, 3000);
      })
      .catch((err) => {
        console.log(err);
        this._notificationService.error(err.statusText);
      });
  }
}

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatRadioModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatContentModule,
    MatCardModule,
    MatMenuModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatTooltipModule,
    FlexLayoutModule,
    TranslateModule,
    LocalizedDateModule,
    MatRatingModule,
  ],
  declarations: [BookPageComponent, KindleDialogComponent],
  entryComponents: [KindleDialogComponent],
  exports: [BookPageComponent],
})
export class BookPageModule {}
