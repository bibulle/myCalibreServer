import { Component, OnInit, NgModule, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Series } from '../series';
import { BookCardModule } from '../../book/book-card/book-card.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-series-card',
  templateUrl: './series-card.component.html',
  styleUrls: ['./series-card.component.scss']
})
export class SeriesCardComponent implements OnInit {

  @Input()
  series: Series;

  thumbnailUrlBase = `${environment.serverUrl}api/series/thumbnail`;

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
    SeriesCardComponent
  ],
  exports: [
    SeriesCardComponent
  ]
})
export class SeriesCardModule {
}
