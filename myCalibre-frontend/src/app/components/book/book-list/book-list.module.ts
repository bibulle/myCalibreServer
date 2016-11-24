import { BookListComponent } from "./book-list.component";
import { MdIconModule } from "@angular2-material/icon";
import { MdCardModule } from "@angular2-material/card";
import { NgModule } from "@angular/core";
import { MdProgressCircleModule } from "@angular2-material/progress-circle";
import { CommonModule } from "@angular/common";
import { MdContentModule } from "../../content/content.component";
import { BookCardModule } from "../book-card/book-card.component";
import { MdToolbarModule } from "@angular2-material/toolbar";
import { MdButtonModule } from "@angular2-material/button";
import { MdCoreModule } from "@angular2-material/core";
import { MdInputModule } from "@angular2-material/input";
import { FormsModule } from "@angular/forms";


@NgModule({
  imports: [
    FormsModule,
    MdCoreModule,
    CommonModule,
    MdCardModule,
    MdButtonModule,
    MdIconModule.forRoot(),
    MdInputModule,
    MdProgressCircleModule,
    MdContentModule,
    MdToolbarModule,
    BookCardModule,
    // MdInputModule,
    // FlexModule,
    // ScrollDetectorModule,
  ],
  declarations: [
    BookListComponent,
  ],
  exports: [
    BookListComponent
  ]
})
export class BookListModule { }
