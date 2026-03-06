import { Controller, Get, Headers, Res, Logger, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiInternalServerException } from '../exceptions/api-internal-server.exception';
import { AuthGuard } from '@nestjs/passport';
import { createReadStream, statSync } from 'fs';
import { CacheKey, CacheService } from '../cache/cache.service';
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
  async getAuthors(@Headers() headers: Record<string, string>, @Res() res): Promise<void> {
    try {
      const path = await this._cacheService.getCachePath(CacheKey.AUTHORS);
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
      throw new ApiInternalServerException('Unable to retrieve authors');
    }
  }
}
