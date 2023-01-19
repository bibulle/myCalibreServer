import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TagListModule } from './tag-list/tag-list.component';
import { TagService } from './tag.service';
import { BookCardModule } from '../book/book-card/book-card.component';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  imports: [
    CommonModule,
    TagListModule,
    MatCardModule,
    MatIconModule,
    BookCardModule
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
