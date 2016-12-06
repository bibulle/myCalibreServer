import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MdCardModule, MdIconModule } from "@angular/material";
import { AuthorService } from "./author.service";
import { AuthorListModule } from "./author-list/author-list.component";

@NgModule({
  imports: [
    CommonModule,
    AuthorListModule,
    MdCardModule,
    MdIconModule
  ],
  providers: [
    AuthorService
  ],
  exports: [
    AuthorListModule
  ],
  declarations: [

    ]
})
export class AuthorModule { }
