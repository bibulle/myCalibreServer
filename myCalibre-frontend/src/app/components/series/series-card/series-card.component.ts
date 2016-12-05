import { Component, OnInit, NgModule, Input } from '@angular/core';
import { CommonModule } from "@angular/common";
import { Series } from "../series";
import { BookCardModule } from "../../book/book-card/book-card.component";
import { MdCardModule, MdIconModule } from "@angular/material";

@Component({
  selector: 'app-series-card',
  templateUrl: './series-card.component.html',
  styleUrls: ['./series-card.component.scss']
})
export class SeriesCardComponent implements OnInit {

  @Input()
  series: Series;

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
    MdCardModule,
    MdIconModule,
    BookCardModule
  ],
  declarations: [
    SeriesCardComponent
  ],
  exports: [
    SeriesCardComponent
  ]
})
export class SeriesCardModule {
}