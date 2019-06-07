import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TagListModule } from './tag-list/tag-list.component';
import { TagService } from './tag.service';

@NgModule({
  imports: [
    CommonModule,
    TagListModule,
    MatCardModule,
    MatIconModule
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
