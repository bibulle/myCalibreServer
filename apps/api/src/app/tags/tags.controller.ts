import { Controller, Get, Headers, Logger, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createReadStream, statSync } from 'fs';
import { CacheKey, CacheService } from '../cache/cache.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';
import { ApiInternalServerException } from '../exceptions/api-internal-server.exception';

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
      throw new ApiInternalServerException('Unable to retrieve tags');
    }
  }
}
