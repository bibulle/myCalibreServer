import { Controller, Get, HttpException, HttpStatus, Logger, StreamableFile, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createReadStream } from 'fs';
import { CacheDateKey, CacheService } from '../cache/cache.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';

@Controller('author')
export class AuthorsController {
  readonly logger = new Logger(AuthorsController.name);

  constructor(private _cacheService: CacheService, private _calibreDb: CalibreDb1Service) {}

  // ====================================
  // route for getting authors
  // ====================================
  @Get('')
  @UseGuards(AuthGuard('jwt'))
  async getAuthors(): Promise<StreamableFile> {
    return new Promise<StreamableFile>((resolve) => {
      this._cacheService
        .getCachePath(CacheDateKey.AUTHORS)
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

}
