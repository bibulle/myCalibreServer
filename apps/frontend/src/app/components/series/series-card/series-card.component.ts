import { CommonModule } from '@angular/common';
import { Component, Input, NgModule, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Series } from '@my-calibre-server/api-interfaces';
import { TranslatePipe } from '@ngx-translate/core';
import { ImageSpritesModule } from '../../image-sprites/image-sprites.component';

const DOT_PALETTE = ['#0d3b3b', '#b0472f', '#23306e', '#2f3d33', '#5c1a24', '#3a4a63', '#8a5a1e', '#155454'];

@Component({
    selector: 'my-calibre-server-series-card',
    templateUrl: './series-card.component.html',
    styleUrls: ['./series-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SeriesCardComponent {
  @Input()
  series?: Series;

  @Input()
  index = 0;

  constructor(private _router: Router) {}

  get dotColor(): string {
    return DOT_PALETTE[this.index % DOT_PALETTE.length];
  }

  openBook(event: Event, bookId: number) {
    event.stopPropagation();
    this._router.navigate(['/book', bookId]);
  }
}

@NgModule({
  imports: [CommonModule, TranslatePipe, ImageSpritesModule],
  declarations: [SeriesCardComponent],
  exports: [SeriesCardComponent],
})
export class SeriesCardModule {}
