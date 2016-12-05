import { Component, OnInit, NgModule, Input } from '@angular/core';
import { Book } from "../book";
import { CommonModule } from "@angular/common";
import { environment } from "../../../../environments/environment";
import { Router } from "@angular/router";
import { MdCardModule, MdIconModule } from "@angular/material";

@Component({
  selector: 'app-book-card',
  templateUrl: './book-card.component.html',
  styleUrls: ['./book-card.component.scss']
})
export class BookCardComponent implements OnInit {

  @Input()
  book: Book;

  thumbnailUrlBase= `${environment.serverUrl}api/book/thumbnail`;


  constructor (private router: Router) { }

  ngOnInit () {
  }

  /**
   * A book has been clicked
   * @param event
   */
  openBook(event) {
    event.stopPropagation();
    this.router.navigate(['/book', this.book.book_id]);
  }


}


@NgModule({
  imports: [
    CommonModule,
    MdCardModule,
    MdIconModule,
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