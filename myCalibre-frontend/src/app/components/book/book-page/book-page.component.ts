import {Component, NgModule, OnInit} from "@angular/core";
import {FilterService} from "../../filter-bar/filter.service";
import {Book} from "../book";
import {environment} from "../../../../environments/environment";
import {ActivatedRoute, Router} from "@angular/router";
import {BookService} from "../book.service";
import {MdContentModule} from "../../content/content.component";
import {CommonModule} from "@angular/common";
import {TitleService} from "../../../app/title.service";
import {FormsModule} from "@angular/forms";
import {MdAutocompleteModule, MdButtonModule, MdCardModule, MdDialog, MdIconModule, MdInputModule, MdMenuModule, MdProgressCircleModule} from "@angular/material";
import {KindleDialogComponent} from "./kindle-dialog/kindle-dialog.component";
import {NotificationService} from "../../notification/notification.service";

@Component({
  selector: 'app-book-page',
  templateUrl: './book-page.component.html',
  styleUrls: ['./book-page.component.scss']
})
export class BookPageComponent implements OnInit {

  //filter: Filter;


  book: Book;

  bookHasEpub = false;
  bookHasMobi = false;

  coverUrlBase = `${environment.serverUrl}api/book/cover`;
  bookUrlBase = `${environment.serverUrl}api/book/`;

  constructor(private _filterService: FilterService,
              private _titleService: TitleService,
              private _bookService: BookService,
              private _route: ActivatedRoute,
              private _router: Router,
              private _dialog: MdDialog,
              private _notificationService: NotificationService) {
  }

  ngOnInit() {

    this._filterService.updateNotDisplayed(true);

    let id = this._route.snapshot.params['id'];

    this._bookService
      .getBook(id)
      .then(book => {
        //console.log(book);
        this.book = book;

        this.book.data.forEach(bd => {
          if (bd.data_format == 'EPUB') {
            this.bookHasEpub = true;
          } else if (bd.data_format == 'MOBI') {
            this.bookHasMobi = true;
          }
        });

        this._titleService.forceTitle(this._router.url, book.book_title);
      })
      .catch(err => {
        console.log(err);
      })


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


      //console.log("Book page '"+email+"'");
      // if there is an email
      if (email) {

        this._bookService
          .sendKindle(this.book.book_id, email)
          .then(() => {
            this._notificationService.info('Book sent');
          })
          .catch(err => {
            console.log(err);
            this._notificationService.error(err.statusText);
          });
      }
    });
  }


}

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MdButtonModule,
    MdIconModule,
    MdInputModule,
    MdProgressCircleModule,
    MdContentModule,
    MdCardModule,
    MdMenuModule.forRoot(),
    MdAutocompleteModule,
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
