import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule, MatIconModule } from '@angular/material';
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
