import { Controller, Get, Headers, HttpException, HttpStatus, Logger, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createReadStream, statSync } from 'fs';
import { CacheKey, CacheService } from '../cache/cache.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';

@Controller('tags')
export class TagsController {
  readonly logger = new Logger(TagsController.name);

  constructor(private _cacheService: CacheService, private _calibreDb: CalibreDb1Service) {}

  // ====================================
  // route for getting tags
  // ====================================
  @Get('')
  @UseGuards(AuthGuard('jwt'))
  async getSeries(@Headers() headers: Record<string, string>, @Res() res): Promise<void> {
    try {
      const path = await this._cacheService.getCachePath(CacheKey.TAGS);
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
}
