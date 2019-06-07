import { Component, OnInit, Input, NgModule } from '@angular/core';
import { Author } from '../author';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BookCardModule } from '../../book/book-card/book-card.component';

@Component({
  selector: 'app-author-card',
  templateUrl: './author-card.component.html',
  styleUrls: ['./author-card.component.scss']
})
export class AuthorCardComponent implements OnInit {

  @Input()
  author: Author;

  @Input()
  booksClosed = true;

  constructor () { }

  //noinspection JSUnusedGlobalSymbols
  ngOnInit () {
  }

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
