import { CommonModule } from '@angular/common';
import { Component, Input, NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Tag } from '@my-calibre-server/api-interfaces';
import { BookCardModule } from '../../book/book-card/book-card.component';

@Component({
  selector: 'my-calibre-server-tag-card',
  templateUrl: './tag-card.component.html',
  styleUrls: ['./tag-card.component.scss']
})
export class TagCardComponent {

  @Input()
  tag?: Tag;

  @Input()
  booksClosed = true;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor () { }

  toggleBooksClosed () {
    this.booksClosed = !this.booksClosed;
  }

}

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    BookCardModule
  ],
  declarations: [
    TagCardComponent
  ],
  exports: [
    TagCardComponent
  ]
})
export class TagCardModule {
}
