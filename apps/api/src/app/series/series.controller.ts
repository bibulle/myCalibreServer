import { Controller, Get, Headers, HttpException, HttpStatus, Logger, NotFoundException, Param, Res, Response, StreamableFile, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createReadStream, existsSync, promises as fsPromises, statSync } from 'fs';
import { CacheKey, CacheService } from '../cache/cache.service';
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
  async getSeries(@Headers() headers: Record<string, string>, @Res() res): Promise<void> {
    try {
      const path = await this._cacheService.getCachePath(CacheKey.SERIES);
      const stats = statSync(path);
      const etag = stats.mtimeMs.toString();
      if (headers['if-none-match'] === etag) {
        return res.status(304).send();
      }

      res.set({
        ETag: etag,
      });

      const file = createReadStream(path);
      file.pipe(res);
    } catch (err) {
      this.logger.error(err);
      throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ====================================
  // route for getting series thumbnail
  // ====================================
  @Get('/thumbnail/:id.png')
  async getThumbnail(@Param('id') series_id: number, @Res() res): Promise<void> {
    const err_cover_path = CacheService.ERR_COVER;
    const thumbnailPath = this._seriesService.getThumbnailPath(series_id);

    try {
      await fsPromises.stat(thumbnailPath);
      res.set({
        'Content-Type': 'image/png',
        'Cache-Control': 'max-age=31536000',
      });
      createReadStream(thumbnailPath).pipe(res);
    } catch {
      res.set({
        'Content-Type': 'image/svg+xml',
        'Cache-control': 'public, max-age=3600',
      });
      createReadStream(err_cover_path).pipe(res);
    }
  }

  // ====================================
  // route for getting series thumbnail sprites
  // ====================================
  @Get('/sprite/:id.png')
  async getSprite(@Param('id') sprite_id: number, @Headers() headers: Record<string, string>, @Res() res): Promise<void> {
    const spritePath = this._seriesService.getSpritesPath(sprite_id);

    if (!existsSync(spritePath)) {
      throw new NotFoundException();
    }
    const stats = statSync(spritePath);
    const etag = stats.mtimeMs.toString();
    if (headers['if-none-match'] === etag) {
      return res.status(304).send();
    }

    res.set({
      'Content-Type': 'image/png',
      ETag: etag,
    });

    createReadStream(spritePath).pipe(res);
  }
}
