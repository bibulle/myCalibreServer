import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthorService } from './author.service';
import { AuthorListModule } from './author-list/author-list.component';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  imports: [
    CommonModule,
    AuthorListModule,
    MatCardModule,
    MatIconModule
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
