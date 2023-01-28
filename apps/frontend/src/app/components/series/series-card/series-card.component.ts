import { CommonModule } from '@angular/common';
import { Component, Input, NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Series } from '@my-calibre-server/api-interfaces';
import { BookCardModule } from '../../book/book-card/book-card.component';
import { ImageSpritesModule } from '../../image-sprites/image-sprites.component';

@Component({
  selector: 'my-calibre-server-series-card',
  templateUrl: './series-card.component.html',
  styleUrls: ['./series-card.component.scss'],
})
export class SeriesCardComponent {
  @Input()
  series?: Series;

  thumbnailUrlBase = `/api/series/thumbnail`;

  @Input()
  booksClosed = true;


  toggleBooksClosed() {
    this.booksClosed = !this.booksClosed;
  }
}

@NgModule({
  imports: [CommonModule, MatCardModule, MatIconModule, BookCardModule, MatButtonModule, ImageSpritesModule],
  declarations: [SeriesCardComponent],
  exports: [SeriesCardComponent],
})
export class SeriesCardModule {}
