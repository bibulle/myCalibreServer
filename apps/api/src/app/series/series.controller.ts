import { Controller, Get, Headers, HttpException, HttpStatus, Logger, NotFoundException, Param, Res, Response, StreamableFile, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createReadStream, existsSync, promises as fsPromises, statSync } from 'fs';
import { CacheDateKey, CacheService } from '../cache/cache.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';
import { SeriesService } from './series.service';

@Controller('series')
export class SeriesController {
  readonly logger = new Logger(SeriesController.name);

  constructor(private _seriesService: SeriesService, private _cacheService: CacheService, private _calibreDb: CalibreDb1Service) {}

  // ====================================
  // route for getting series
  // ====================================
  @Get('')
  @UseGuards(AuthGuard('jwt'))
  async getSeries(@Headers() headers: Record<string, string>, @Res({ passthrough: true }) res): Promise<StreamableFile> {
    return new Promise<StreamableFile>((resolve) => {
      this._cacheService
        .getCachePath(CacheDateKey.SERIES)
        .then((path) => {
          const stats = statSync(path);
          const etag = stats.mtimeMs.toString();
          if (headers['if-none-match'] === etag) {
            return res.status(304).send('No change');
          }

          res.set({
            ETag: etag,
          });

          const file = createReadStream(path);
          resolve(new StreamableFile(file));
        })
        .catch((err) => {
          this.logger.error(err);
          throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });
  }

  // ====================================
  // route for getting series thumbnail
  // ====================================
  @Get('/thumbnail/:id.png')
  async getThumbnail(@Param('id') series_id: number, @Response({ passthrough: true }) res): Promise<StreamableFile> {
    const err_cover_path = CacheService.ERR_COVER;

    return new Promise<StreamableFile>((resolve) => {
      const thumbnailPath = this._seriesService.getThumbnailPath(series_id);

      fsPromises
        .stat(thumbnailPath)
        .then(() => {
          res.set({
            'Content-Type': 'image/png',
            'Cache-Control': 'max-age=31536000',
          });
          resolve(new StreamableFile(createReadStream(thumbnailPath)));
        })
        .catch(() => {
          res.set({
            'Content-Type': 'image/svg+xml',
            'Cache-control': 'public, max-age=3600',
          });
          resolve(new StreamableFile(createReadStream(err_cover_path)));
        });
    });
  }

  // ====================================
  // route for getting series thumbnail sprites
  // ====================================
  @Get('/sprite/:id.png')
  async getSprite(@Param('id') sprite_id: number, @Headers() headers: Record<string, string>, @Res({ passthrough: true }) res): Promise<StreamableFile> {
    return new Promise<StreamableFile>((resolve) => {
      const spritePath = this._seriesService.getSpritesPath(sprite_id);

      if (!existsSync(spritePath)) {
        throw new NotFoundException();
      }
      const stats = statSync(spritePath);
      const etag = stats.mtimeMs.toString();
      if (headers['if-none-match'] === etag) {
        return res.status(304).send('No change');
      }

      res.set({
        'Content-Type': 'image/png',
        ETag: etag,
      });

      resolve(new StreamableFile(createReadStream(spritePath)));
    });
  }

}
