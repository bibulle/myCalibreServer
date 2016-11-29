import { BookListComponent, BookListModule } from "./book-list/book-list.component";
import { BookService } from "./book.service";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MdCardModule } from "@angular2-material/card";
import { MdIconModule } from "@angular2-material/icon";
import { BookPageModule } from './book-page/book-page.component';

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
