import { Component, HostBinding, Input, NgModule } from '@angular/core';
import { ThumbnailUtils } from '@my-calibre-server/api-interfaces';

@Component({
  selector: 'my-calibre-server-image-sprites',
  templateUrl: './image-sprites.component.html',
  styleUrls: ['./image-sprites.component.scss'],
})
export class ImageSpritesComponent {

  @Input()
  book_id = 0;

  @HostBinding('style.background-image') get image() {
    return `url(/api/book/sprite/${ThumbnailUtils.getSpritesIndex(this.book_id)}.png`;
  }
  @HostBinding('style.background-position-x') get positionX() {
    return `${-1 * 80 * ThumbnailUtils.getIndexInSprites(this.book_id)}px`;
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