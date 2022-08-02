import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRatingModule } from '../rating/rating.component';
import { BookListComponent, BookListModule } from './book-list/book-list.component';
import { BookPageModule } from './book-page/book-page.component';
import { BookService } from './book.service';

@NgModule({
  imports: [
    CommonModule,
    BookListModule,
    MatCardModule,
    BookPageModule,
    MatIconModule,
    FlexLayoutModule,
    MatRatingModule
  ],
  providers: [
    BookService
  ],
  exports: [
    BookListComponent
  ],
  declarations: [
  ]
})
export class BookModule { }
