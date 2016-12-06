import { Component, OnInit, NgModule } from '@angular/core';
import { FilterService, Filter } from "../../filter-bar/filter.service";
import { Book } from "../book";
import { environment } from "../../../../environments/environment";
import { ActivatedRoute, Router } from "@angular/router";
import { BookService } from "../book.service";
import { MdContentModule } from "../../content/content.component";
import { CommonModule } from "@angular/common";
import { TitleService } from "../../../app/title.service";
import { FormsModule } from "@angular/forms";
import {
  MdIconModule, MdInputModule, MdProgressCircleModule, MdCardModule, MdMenuModule, MdDialog,
  MdSnackBar
} from "@angular/material";
import { KindleDialogComponent } from "./kindle-dialog/kindle-dialog.component";

@Component({
  selector: 'app-book-page',
  templateUrl: './book-page.component.html',
  styleUrls: ['./book-page.component.scss']
})
export class BookPageComponent implements OnInit {

  filter: Filter = new Filter({ 'not_displayed': true });


  book: Book;

  bookHasEpub = false;
  bookHasMobi = false;

  coverUrlBase = `${environment.serverUrl}api/book/cover`;
  bookUrlBase = `${environment.serverUrl}api/book/`;

  constructor (private _filterService: FilterService,
               private _titleService: TitleService,
               private _bookService: BookService,
               private _route: ActivatedRoute,
               private _router: Router,
               private _dialog: MdDialog,
               private _snackBar: MdSnackBar) { }

  ngOnInit () {

    this._filterService.update(this.filter);

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


          this._titleService.update(book.book_title, '/books');
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
  openAuthor (author_id, author_name) {
    event.stopPropagation();
    this._router.navigate(['/authors', { id: author_id, name: author_name} ]);
  }

  /** Open send to kindle dialog
   *
   */
  openDialog () {
    let dialogRef = this._dialog.open(KindleDialogComponent, {});

    dialogRef.afterClosed().subscribe(email => {

      //console.log("Book page '"+email+"'");
      // if there is an email
      if (email) {

        this._bookService
            .sendKindle(this.book.book_id, email)
            .then(() => {
              this._snackBar.open('Book sent');
            })
            .catch(err => {
              console.log(err);
              this._snackBar.open(err.statusText);
            });
      }
    });
  }


}

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MdIconModule,
    MdInputModule,
    MdProgressCircleModule,
    MdContentModule,
    MdCardModule,
    MdMenuModule.forRoot(),
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
