export class ThumbnailUtils {
  static readonly SPRITES_SIZE = 50;
  static readonly THUMBNAIL_HEIGHT = 160;

  static getSpritesIndex(book_id: number): number {
    return ThumbnailUtils.SPRITES_SIZE * Math.floor(book_id / ThumbnailUtils.SPRITES_SIZE);
  }
  static getIndexInSprites(book_id: number): number {
    return book_id % ThumbnailUtils.SPRITES_SIZE;
  }

}

export class Sprite {
  id = 0;
  spriteTime = 0;
  thumbnailTime = 0;
}
