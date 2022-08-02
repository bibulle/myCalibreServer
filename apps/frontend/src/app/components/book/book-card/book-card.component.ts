import { CommonModule } from '@angular/common';
import { Component, Input, NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Book } from '@my-calibre-server/api-interfaces';
import { TranslateModule } from '@ngx-translate/core';
import { MatRatingModule } from '../../rating/rating.component';

@Component({
  selector: 'my-calibre-server-book-card',
  templateUrl: './book-card.component.html',
  styleUrls: ['./book-card.component.scss']
})
export class BookCardComponent {

  @Input()
  book: Book = new Book();

  @Input()
  index = -1;

  thumbnailUrlBase = `/api/book/thumbnail`;


  constructor (private router: Router) { }

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


}


@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    FlexLayoutModule,
    TranslateModule,
    MatRatingModule
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
