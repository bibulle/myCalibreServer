import { Component, OnInit, NgModule } from '@angular/core';
import { FilterService, Filter } from "../../filter-bar/filter.service";
import { Book } from "../book";
import { environment } from "../../../../environments/environment";
import { ActivatedRoute } from "@angular/router";
import { BookService } from "../book.service";
import { MdProgressCircleModule } from "@angular2-material/progress-circle";
import { MdContentModule } from "../../content/content.component";
import { CommonModule } from "@angular/common";
import { TitleService } from "../../../app/title.service";

@Component({
  selector: 'app-book-page',
  templateUrl: './book-page.component.html',
  styleUrls: ['./book-page.component.scss']
})
export class BookPageComponent implements OnInit {

  filter: Filter = new Filter({'not_displayed': true});


  book: Book;

  coverUrlBase= `${environment.serverUrl}api/book/cover`;

  constructor(private _filterService: FilterService,
              private _titleService: TitleService,
              private _bookService: BookService,
              private _route: ActivatedRoute) { }

  ngOnInit() {

    this._filterService.update(this.filter);

    let id = this._route.snapshot.params['id'];

    this._bookService
        .getBook(id)
        .then(book => {
          console.log(book);
          this.book = book;
          this._titleService.update(book.book_title);
        })
        .catch(err => {
          console.log(err);
        })


  }

}

@NgModule({
  imports: [
    CommonModule,
    MdProgressCircleModule,
    MdContentModule,
  ],
  declarations: [
    BookPageComponent,
  ],
  exports: [
    BookPageComponent
  ]
})
export class BookPageModule { }
