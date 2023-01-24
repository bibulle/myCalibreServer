import { Controller, Get, HttpException, HttpStatus, Logger, Param, Response, StreamableFile, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createReadStream, promises as fsPromises } from 'fs';
import { CacheDateKey, CacheService } from '../cache/cache.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';
import path = require('path');
import { SeriesService } from './series.service';

@Controller('series')
export class SeriesController {
  readonly logger = new Logger(SeriesController.name);

  constructor(private _serviesService: SeriesService, private _cacheService: CacheService, private _calibreDb: CalibreDb1Service) {}

  // ====================================
  // route for getting series
  // ====================================
  @Get('')
  @UseGuards(AuthGuard('jwt'))
  async getSeries(): Promise<StreamableFile> {
    return new Promise<StreamableFile>((resolve) => {
      this._cacheService
        .getCachePath(CacheDateKey.SERIES)
        .then((path) => {
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
      const thumbnailPath = this._serviesService.getThumbnailPath(series_id);

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

}
