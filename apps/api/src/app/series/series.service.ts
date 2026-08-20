import { ThumbnailUtils, Series, Sprite } from '@my-calibre-server/api-interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { existsSync, mkdirSync, statSync, unlinkSync } from 'fs';
import { dirname } from 'path';
import path = require('path');
import { OverlayOptions } from 'sharp';
import * as sharpNs from 'sharp';
// sharp 0.35 publie des types ESM (`export default`) que la résolution `node`
// du monorepo charge même en CommonJS : le namespace n'y est plus appelable.
// À l'exécution, `require('sharp')` reste la fonction elle-même ; cet alias
// rétablit donc le typage sans rien changer au code émis.
const sharp = sharpNs as unknown as typeof sharpNs.default;
import { BooksService } from '../books/books.service';
import { CacheService } from '../cache/cache.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';

@Injectable()
export class SeriesService {
  private static readonly logger = new Logger(SeriesService.name);

  constructor(private _calibreDbService: CalibreDb1Service) {}

  getThumbnailPath(series_id: number): string {
    return path.resolve(`${CacheService.THUMBNAIL_SERIES_DIR}/${series_id}/thumbnail.png`);
  }
  getSpritesPath(index: number) {
    const indexStr = index.toString().padStart(6, '0');
    return path.resolve(`${CacheService.SPRITE_DIR}/sprites_series_${indexStr}.png`);
  }

  getSpriteDate(series: Series): number {
    const spriteId = ThumbnailUtils.getSpritesIndex(series.series_id);
    const spritePath = this.getSpritesPath(spriteId);
    const stat = statSync(spritePath, { throwIfNoEntry: false });
    return stat ? stat.mtimeMs : 0;
  }
  getThumbnailDate(series: Series): number {
    const thumbnailPath = this.getThumbnailPath(series.series_id);
    const stat = statSync(thumbnailPath, { throwIfNoEntry: false });
    return stat ? stat.mtimeMs : 0;
  }

  async calculateSpritesSeriesThumbnail(): Promise<void> {
    // SeriesService.logger.debug('calculateSpritesSeriesThumbnail()');

    try {
      const series = await this._calibreDbService.getAllSeries();
      const spriteList: Sprite[] = [
        ...new Set<Sprite>(
          series
            .map((s) => {
              return { id: ThumbnailUtils.getSpritesIndex(s.series_id), spriteTime: this.getSpriteDate(s), thumbnailTime: this.getThumbnailDate(s) };
            })
            .reduce((accumulator, current) => {
              const found = accumulator.find((s) => s.id === current.id);
              if (found) {
                found.thumbnailTime = current.thumbnailTime > found.thumbnailTime ? current.thumbnailTime : found.thumbnailTime;
              } else {
                accumulator.push(current);
              }
              return accumulator;
            }, [] as Sprite[])
            .filter((s) => s.thumbnailTime >= s.spriteTime)
        ),
      ].sort((s1, s2) => s1.id - s2.id);
      // SeriesService.logger.debug(spriteList);

      for (const i of spriteList) {
        SeriesService.logger.debug(`sprite ${i.id} start`);

        await this.createSpritesSeries(i.id);

        SeriesService.logger.debug(`sprite ${i.id} done`);
      }

      // SeriesService.logger.debug('calculateSpritesSeriesThumbnail done');
    } catch (reason) {
      SeriesService.logger.error(reason);
      throw reason;
    }
  }

  createSpritesSeries(index: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      mkdirSync(dirname(this.getSpritesPath(index)), { recursive: true });
      this.getSpritesSeriesOverlay(index)
        .then(async (overlay) => {
          const canvasWidth = ThumbnailUtils.SPRITES_SIZE * ThumbnailUtils.THUMBNAIL_HEIGHT;
          const safeOverlay = await this.removeOversizedOverlays(overlay, canvasWidth, ThumbnailUtils.THUMBNAIL_HEIGHT);

          // create empty image (and add overlay)
          sharp({ create: { width: ThumbnailUtils.SPRITES_SIZE * ThumbnailUtils.THUMBNAIL_HEIGHT, height: ThumbnailUtils.THUMBNAIL_HEIGHT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
            .composite(safeOverlay)
            .png({ palette: true, compressionLevel: 9 })
            .toBuffer()
            .then((buffer) => {
              sharp(buffer).toFile(this.getSpritesPath(index), (err) => {
                if (err) {
                  SeriesService.logger.error(err);
                  reject(err);
                } else {
                  // BooksService.logger.debug(info);
                  process.nextTick(resolve);
                }
              });
            });
        })
        .catch((reason) => {
          SeriesService.logger.error(reason);
          reject(reason);
        });
    });
  }

  /**
   * `sharp.composite()` only ever inspects the raw file on disk, never the resized in-memory
   * `info` used to position overlays. A stale thumbnail (e.g. left over from an older version of
   * the code) that no longer fits the sprite canvas would otherwise crash the whole process.
   * Drop and delete any such file so it gets regenerated by calculateMissingSeriesThumbnail.
   */
  async removeOversizedOverlays(overlay: OverlayOptions[], canvasWidth: number, canvasHeight: number): Promise<OverlayOptions[]> {
    const result: OverlayOptions[] = [];
    for (const o of overlay) {
      const inputPath = o.input as string;
      const meta = await sharp(inputPath)
        .metadata()
        .catch(() => undefined);

      if (!meta) {
        SeriesService.logger.warn(`Could not read metadata for ${inputPath}, excluding it from this sprite`);
        continue;
      }

      const oversized = (meta.width ?? 0) > canvasWidth || (meta.height ?? 0) > canvasHeight;
      if (!oversized) {
        result.push(o);
        continue;
      }

      if (inputPath === CacheService.ERR_COVER_THUMBNAIL) {
        SeriesService.logger.error(`Shared placeholder ${inputPath} is oversized (${meta.width}x${meta.height}), skipping this sprite entry`);
        continue;
      }

      SeriesService.logger.warn(`Removing stale/oversized thumbnail ${inputPath} (${meta.width}x${meta.height}), it will be regenerated`);
      try {
        unlinkSync(inputPath);
      } catch (unlinkErr) {
        SeriesService.logger.error(`Failed to remove ${inputPath}: ${unlinkErr}`);
      }
    }
    return result;
  }

  async getSpritesSeriesOverlay(index: number): Promise<OverlayOptions[]> {
    try {
      const err_info = await BooksService.getThumbnailInfo(CacheService.ERR_COVER_THUMBNAIL);
      const series = await this._calibreDbService.getAllSeries();
      const overlay: Promise<OverlayOptions>[] = series
        .filter((s) => ThumbnailUtils.getSpritesIndex(s.series_id) === index)
        .map(async (s) => {
          let info = err_info;
          let path = CacheService.ERR_COVER_THUMBNAIL;
          if (existsSync(this.getThumbnailPath(s.series_id))) {
            path = this.getThumbnailPath(s.series_id);
            const my_info = await BooksService.getThumbnailInfo(path).catch((err) => {
              SeriesService.logger.debug(err);
            });
            if (my_info) {
              info = my_info;
            }
            // BooksService.logger.debug(path);
          }
          return {
            input: path,
            top: 0,
            left: ThumbnailUtils.THUMBNAIL_HEIGHT * ThumbnailUtils.getIndexInSprites(s.series_id) + Math.round((ThumbnailUtils.THUMBNAIL_HEIGHT - info.width) / 2),
          };
        });
      return await Promise.all(overlay);
    } catch (reason) {
      throw reason;
    }
  }
}
