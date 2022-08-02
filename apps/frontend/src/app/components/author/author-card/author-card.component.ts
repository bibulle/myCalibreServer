import { Component, OnInit, Input, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BookCardModule } from '../../book/book-card/book-card.component';
import { Author } from '@my-calibre-server/api-interfaces';

@Component({
  selector: 'my-calibre-server-author-card',
  templateUrl: './author-card.component.html',
  styleUrls: ['./author-card.component.scss']
})
export class AuthorCardComponent {

  @Input()
  author?: Author;

  @Input()
  booksClosed = true;

  toggleBooksClosed () {
    this.booksClosed = !this.booksClosed;
  }

}

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    BookCardModule
  ],
  declarations: [
    AuthorCardComponent
  ],
  exports: [
    AuthorCardComponent
  ]
})
export class AuthorCardModule {
}
