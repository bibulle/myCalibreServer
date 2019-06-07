import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthorService } from './author.service';
import { AuthorListModule } from './author-list/author-list.component';

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
