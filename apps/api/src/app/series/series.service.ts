import { ThumbnailUtils, Series, Sprite } from '@my-calibre-server/api-interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { existsSync, mkdirSync, statSync } from 'fs';
import { dirname } from 'path';
import path = require('path');
import { OverlayOptions } from 'sharp';
import sharp = require('sharp');
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

          // Diagnostic only: `overlay[].input` is the raw file on disk, never re-verified against
          // the in-memory resized `info` used to compute `left` in getSpritesSeriesOverlay. Read
          // its real on-disk dimensions here to catch any stale/oversized file before it reaches
          // sharp's composite (which checks the RAW file, not the resized one).
          const realDims = await Promise.all(
            overlay.map(async (o) => {
              try {
                const meta = await sharp(o.input as string).metadata();
                return { input: o.input, top: o.top, left: o.left, realWidth: meta.width, realHeight: meta.height };
              } catch (metaErr) {
                return { input: o.input, top: o.top, left: o.left, metaError: String(metaErr) };
              }
            })
          );
          const isOversized = (d: (typeof realDims)[number]) => (d.realWidth ?? 0) > canvasWidth || (d.realHeight ?? 0) > ThumbnailUtils.THUMBNAIL_HEIGHT;
          const oversizedCount = realDims.filter(isOversized).length;
          SeriesService.logger.warn(`[createSpritesSeries] index=${index} canvas=${canvasWidth}x${ThumbnailUtils.THUMBNAIL_HEIGHT} items=${realDims.length} oversized=${oversizedCount}`);
          // sharp's composite() iterates the overlay array in order and throws on the FIRST
          // entry that doesn't fit, so that's the one actually responsible for the crash below.
          const firstOversizedIndex = realDims.findIndex(isOversized);
          if (firstOversizedIndex >= 0) {
            SeriesService.logger.error(
              `[createSpritesSeries] index=${index} FIRST oversized entry (position ${firstOversizedIndex}/${realDims.length}), this is the one sharp will crash on: ${JSON.stringify(
                realDims[firstOversizedIndex]
              )}`
            );
          }

          // create empty image (and add overlay)
          sharp({ create: { width: ThumbnailUtils.SPRITES_SIZE * ThumbnailUtils.THUMBNAIL_HEIGHT, height: ThumbnailUtils.THUMBNAIL_HEIGHT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
            .composite(overlay)
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
