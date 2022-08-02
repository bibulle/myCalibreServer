import { Status } from '@my-calibre-server/api-interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { CacheDateKey, CacheService } from '../cache/cache.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';

@Injectable()
export class HealthService {
  readonly logger = new Logger(HealthService.name);

  constructor(private _cacheService: CacheService, private _calibreDb: CalibreDb1Service) {}

  getHealthSattus(): Promise<Status> {
    return new Promise<Status>((resolve, reject) => {
      Promise.allSettled([
        this._calibreDb.getDbDate(),
        this._calibreDb.getBooksCount(),
        this._cacheService.getCacheDate(CacheDateKey.NEW_BOOKS),
        this._cacheService.getCacheDate(CacheDateKey.BOOKS),
        this._cacheService.getCacheDate(CacheDateKey.SERIES),
        this._cacheService.getCacheDate(CacheDateKey.AUTHORS),
        this._cacheService.getCacheDate(CacheDateKey.TAGS),
      ])
        .then((results) => {
          const ret = new Status();
          results.forEach((r, index) => {
            if (r.status === 'fulfilled') {
              switch (index) {
                case 0:
                  ret.calibreDate = r.value as Date;
                  break;
                case 1:
                  ret.calibreSize = +r.value;
                  break;
                case 2:
                  ret.cacheNewBooks = r.value as Date;
                  break;
                case 3:
                  ret.cacheBooks = r.value as Date;
                  break;
                case 4:
                  ret.cacheSeries = r.value as Date;
                  break;
                case 5:
                  ret.cacheAuthor = r.value as Date;
                  break;
                case 6:
                  ret.cacheTags = r.value as Date;
                  break;
              }
            } else {
              switch (index) {
                case 0:
                case 1:
                  ret.calibreStatus = `KO : ${r.reason}`;
                  break;
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                  ret.cacheStatus = `KO : ${r.reason}`;
                  break;
              }
            }
          });
          resolve(ret);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
