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

  calculateSpritesSeriesThumbnail(): Promise<void> {
    // SeriesService.logger.debug('calculateSpritesSeriesThumbnail()');

    return new Promise<void>((resolve, reject) => {
      // const spriteList = {};
      this._calibreDbService
        .getAllSeries()
        .then(async (series) => {
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

          process.nextTick(resolve);
        })
        .catch((reason) => {
          SeriesService.logger.error(reason);
          reject(reason);
        });
    });
  }

  createSpritesSeries(index: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      mkdirSync(dirname(this.getSpritesPath(index)), { recursive: true });
      this.getSpritesSeriesOverlay(index)
        .then((overlay) => {
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

  getSpritesSeriesOverlay(index: number): Promise<OverlayOptions[]> {
    return new Promise<OverlayOptions[]>((resolve, reject) => {
      BooksService.getThumbnailInfo(CacheService.ERR_COVER_THUMBNAIL)
        .then((err_info) => {
          this._calibreDbService.getAllSeries().then((series) => {
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
            Promise.all(overlay)
              .then((r) => {
                process.nextTick(() => {
                  resolve(r);
                });
              })
              .catch((reason) => {
                reject(reason);
              });
          });
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }
}
