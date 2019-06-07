import { Component, OnInit, NgModule, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BookCardModule } from '../../book/book-card/book-card.component';
import { Tag } from '../tag';

@Component({
  selector: 'app-tag-card',
  templateUrl: './tag-card.component.html',
  styleUrls: ['./tag-card.component.scss']
})
export class TagCardComponent implements OnInit {

  @Input()
  tag: Tag;

  @Input()
  booksClosed = true;

  constructor () { }

  //noinspection JSUnusedGlobalSymbols
  ngOnInit () {
  }

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
