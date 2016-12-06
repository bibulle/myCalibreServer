import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MdCardModule, MdIconModule } from "@angular/material";
import { TagListModule } from "./tag-list/tag-list.component";
import { TagService } from "./tag.service";

@NgModule({
  imports: [
    CommonModule,
    TagListModule,
    MdCardModule,
    MdIconModule
  ],
  providers: [
    TagService
  ],
  exports: [
    TagListModule
  ],
  declarations: [

    ]
})
export class TagModule { }
