import {Component, NgModule, OnInit} from '@angular/core';
import {FilterService} from '../../filter-bar/filter.service';
import {Book} from '../book';
import {environment} from '../../../../environments/environment';
import {ActivatedRoute, Router} from '@angular/router';
import {BookService} from '../book.service';
import {MatContentModule} from '../../content/content.component';
import {CommonModule} from '@angular/common';
import {TitleService} from '../../../app/title.service';
import {FormsModule} from '@angular/forms';
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatCardModule,
  MatDialog,
  MatDialogModule,
  MatIconModule,
  MatInputModule,
  MatMenuModule,
  MatProgressSpinnerModule, MatTooltipModule
} from '@angular/material';
import {KindleDialogComponent} from './kindle-dialog/kindle-dialog.component';
import {NotificationService} from '../../notification/notification.service';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TranslateModule} from '@ngx-translate/core';
import {LocalizedDateModule} from '../../../directives/localized-date.pipe';
import {MatRatingModule} from '../../rating/rating.component';
import {UserService} from '../../authent/user.service';

@Component({
  selector: 'app-book-page',
  templateUrl: './book-page.component.html',
  styleUrls: ['./book-page.component.scss']
})
export class BookPageComponent implements OnInit {

  // filter: Filter;


  book: Book;

  bookHasEpub = false;
  bookHasMobi = false;
  bookReaderRating;
  bookYourRating;

  coverUrlBase = `${environment.serverUrl}api/book/cover`;

  constructor(private _filterService: FilterService,
              private _titleService: TitleService,
              private _bookService: BookService,
              private _route: ActivatedRoute,
              private _router: Router,
              private _dialog: MatDialog,
              private _notificationService: NotificationService,
              private _userService: UserService) {
  }

  ngOnInit() {

    this._filterService.updateNotDisplayed(true);

    let id = this._route.snapshot.params['id'];

    this._bookService
      .getBook(id)
      .then(book => {
        // console.log(book);
        this.book = book;

        this.book.data.forEach(bd => {
          if (bd.data_format === 'EPUB') {
            this.bookHasEpub = true;
          } else if (bd.data_format === 'MOBI') {
            this.bookHasMobi = true;
          }
        });

        // TODO remove MOCK
        this.book.history = {
          ratings: [],
          downloads: []
        };
        this.book.history.ratings = [
          {
            date: new Date('2018-04-20 17:39:31'),
            rating: 3,
            user_name: 'user1',
            user_id: 'user1'
          },
          {
            date: new Date('2018-01-01 17:39:31'),
            rating: 2,
            user_name: 'user2',
            user_id: 'user2'
          }];
        // end TODO

        if (this.book.history.ratings && (this.book.history.ratings.length !== 0)) {
          this.bookReaderRating = 0;
          for (let i = 0; i < this.book.history.ratings.length; i++) {
            this.bookReaderRating += this.book.history.ratings[i].rating / this.book.history.ratings.length;
            if (this.book.history.ratings[i].user_id === this._userService.getUser().id) {
              this.bookYourRating = this.book.history.ratings[i].rating;
            }
          }
        }
        // console.log(book);

        this._titleService.forceTitle(this._router.url, book.book_title);
      })
      .catch(err => {
        console.log(err);
      })


  }

  ratingUpdated(rating) {
    // console.log('RATING : ' + rating);
    this._bookService
      .updateRating(this.book.book_id, rating)
      .then(() => {
        setTimeout(() => {
          this._userService.refreshUser()
            .catch(err => {
              console.log(err);
            });
        }, 3000);
        this._notificationService.info('Book sent');
      })
      .catch(err => {
        console.log(err);
        this._notificationService.error(err.statusText);
      });
  }

  /**
   * An author has been clicked
   * @param author_id
   * @param author_name
   */
  openAuthor(author_id, author_name) {
    event.stopPropagation();
    //noinspection JSIgnoredPromiseFromCall
    this._router.navigate(['/authors'], {queryParams: {id: author_id, name: author_name}});
  }

  /**
   * A tag has been clicked
   * @param tag_id
   * @param tag_name
   */
  openTag(tag_id, tag_name) {
    event.stopPropagation();
    //noinspection JSIgnoredPromiseFromCall
    this._router.navigate(['/tags'], {queryParams: {id: tag_id, name: tag_name}});
  }

  /**
   * A series has been clicked
   * @param series_id
   * @param series_name
   */
  openSeries(series_id, series_name) {
    event.stopPropagation();
    //noinspection JSIgnoredPromiseFromCall
    this._router.navigate(['/series'], {queryParams: {id: series_id, name: series_name}});
  }

  /** Open send to kindle dialog
   *
   */
  openDialog() {
    let dialogRef = this._dialog.open(KindleDialogComponent, {});

    dialogRef.afterClosed().subscribe(email => {


      // console.log("Book page '"+email+"'");
      // if there is an email
      if (email) {

        this._bookService
          .sendKindle(this.book.book_id, email)
          .then(() => {
            setTimeout(() => {
              this._userService.refreshUser()
                .catch(err => {
                  console.log(err);
                });
            }, 3000);
            this._notificationService.info('Book sent');
          })
          .catch(err => {
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
        let link = document.createElement('a');

        link.setAttribute('href', url);
        // link.setAttribute('download', this.book.book_id+'.epub');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => {
          this._userService.refreshUser()
            .catch(err => {
              console.log(err);
            });
        }, 3000);
      })
      .catch(err => {
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
        let link = document.createElement('a');

        link.setAttribute('href', url);
        // link.setAttribute('download', this.book.book_id+'.mobi');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => {
          this._userService.refreshUser()
            .catch(err => {
              console.log(err);
            });
        }, 3000);
      })
      .catch(err => {
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
    MatRatingModule
  ],
  declarations: [
    BookPageComponent,
    KindleDialogComponent
  ],
  entryComponents: [
    KindleDialogComponent
  ],
  exports: [
    BookPageComponent,

  ]
})
export class BookPageModule {
}
