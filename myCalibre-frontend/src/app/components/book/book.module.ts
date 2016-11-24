import { BookListComponent } from "./book-list/book-list.component";
import { BookService } from "./book.service";
import { NgModule } from "@angular/core";
import { BookListModule } from "./book-list/book-list.module";
import { BookCardComponent } from './book-card/book-card.component';
import { CommonModule } from "@angular/common";
import { MdCardModule } from "@angular2-material/card";
import { MdIconModule } from "@angular2-material/icon";

@NgModule({
  imports: [
    CommonModule,
    BookListModule,
    MdCardModule,
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
