import { Component, OnInit, NgModule, Input } from '@angular/core';
import { CommonModule } from "@angular/common";
import { MdCardModule } from "@angular2-material/card";
import { MdIconModule } from "@angular2-material/icon";
import { Series } from "../series";
import { BookCardModule } from "../../book/book-card/book-card.component";

@Component({
  selector: 'app-series-card',
  templateUrl: './series-card.component.html',
  styleUrls: ['./series-card.component.scss']
})
export class SeriesCardComponent implements OnInit {

  @Input()
  series: Series;

  constructor() { }

  ngOnInit() {
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