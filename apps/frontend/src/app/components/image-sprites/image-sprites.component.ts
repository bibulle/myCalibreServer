import { Component, HostBinding, Input, NgModule } from '@angular/core';
import { ThumbnailUtils } from '@my-calibre-server/api-interfaces';

@Component({
  selector: 'my-calibre-server-image-sprites',
  templateUrl: './image-sprites.component.html',
  styleUrls: ['./image-sprites.component.scss'],
})
export class ImageSpritesComponent {

  TYPE_BOOK=0;
  TYPE_SERIES=1;

  @Input()
  type = this.TYPE_BOOK;

  @Input()
  id = 0;

  @HostBinding('style.background-image') get image() {
    if (this.type === this.TYPE_SERIES) {
      return `url(/api/series/sprite/${ThumbnailUtils.getSpritesIndex(this.id)}.png`;
    }
    return `url(/api/book/sprite/${ThumbnailUtils.getSpritesIndex(this.id)}.png`;
  }
  @HostBinding('style.background-position-x') get positionX() {
    return `${-1 * 80 * ThumbnailUtils.getIndexInSprites(this.id)}px`;
  }

}

@NgModule({
  imports: [
  ],
  declarations: [
    ImageSpritesComponent
  ],
  exports: [
    ImageSpritesComponent
  ]
})
export class ImageSpritesModule {}