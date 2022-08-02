import { Injectable } from '@nestjs/common';
import path = require('path');
import { CacheService } from '../cache/cache.service';


@Injectable()
export class SeriesService {

  getThumbnailPath(series_id: number): string {
    return path.resolve(`${CacheService.THUMBNAIL_SERIES_DIR}/${series_id}/thumbnail.png`);
  }

}
