import { BookListComponent, BookListModule } from "./book-list/book-list.component";
import { BookService } from "./book.service";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BookPageModule } from './book-page/book-page.component';
import { MdCardModule, MdIconModule } from "@angular/material";

@NgModule({
  imports: [
    CommonModule,
    BookListModule,
    MdCardModule,
    BookPageModule,
    MdIconModule
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
