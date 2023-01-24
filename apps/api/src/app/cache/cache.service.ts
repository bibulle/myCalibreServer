import { ApiReturn, Author, Book, CacheContent, Series, Tag } from '@my-calibre-server/api-interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import * as fs from 'fs';
import * as path from 'path';
import { CalibreDb1Service } from '../database/calibre-db1.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  private static MY_CALIBRE_DIR: string;
  private static CACHE_DIR: string;
  public static THUMBNAIL_DIR: string;
  public static THUMBNAIL_SERIES_DIR: string; 
  public static SPRITE_DIR: string; 

  public static ERR_COVER:string;
  public static ERR_COVER_THUMBNAIL:string;

  private static cacheTables: { [key: string]: CacheDate } = {};

  private static readonly CRON_CACHE_FORCE_DEFAULT = CronExpression.EVERY_DAY_AT_4AM;
  private static readonly CRON_CACHE_RECURRING_DEFAULT = CronExpression.EVERY_10_MINUTES;
  private static cronCacheForce = CacheService.CRON_CACHE_FORCE_DEFAULT;
  private static cronCacheRecurrent = CacheService.CRON_CACHE_RECURRING_DEFAULT;

  constructor(
    private readonly _configService: ConfigService,
    private readonly _usersService: UsersService,
    private readonly _calibreDbService: CalibreDb1Service,
    private readonly _schedulerRegistry: SchedulerRegistry
  ) {
    CacheService.MY_CALIBRE_DIR = this._configService.get('PATH_MY_CALIBRE') || path.resolve(`${__dirname}/../../../data/my-calibre`);
    CacheService.CACHE_DIR = `${CacheService.MY_CALIBRE_DIR}/cache`;
    CacheService.THUMBNAIL_DIR = `${CacheService.MY_CALIBRE_DIR}/thumbnail`;
    CacheService.THUMBNAIL_SERIES_DIR = `${CacheService.MY_CALIBRE_DIR}/thumbnail_series`;
    CacheService.SPRITE_DIR = `${CacheService.MY_CALIBRE_DIR}/sprites`;
    CacheService.ERR_COVER = path.resolve(`${__dirname}/assets//err_cover.svg`);
    CacheService.ERR_COVER_THUMBNAIL = path.resolve(`${CacheService.THUMBNAIL_DIR}/err/thumbnail.png`);

    this.logger.debug(`Cache            dir : ${CacheService.CACHE_DIR}`);
    this.logger.debug(`Thumbnail        dir : ${CacheService.THUMBNAIL_DIR}`);
    this.logger.debug(`Thumbnail series dir : ${CacheService.THUMBNAIL_SERIES_DIR}`);
    this.logger.debug(`Sprites          dir : ${CacheService.SPRITE_DIR}`);

    CacheService.cronCacheForce = this._configService.get('CRON_CACHE_FORCE', CacheService.CRON_CACHE_FORCE_DEFAULT);
    CacheService.cronCacheRecurrent = this._configService.get('CRON_CACHE_RECURRING', CacheService.CRON_CACHE_RECURRING_DEFAULT);
    this.logger.debug(`cronCacheRecurrent   : ${CacheService.cronCacheRecurrent}`);
    this.logger.debug(`cronCacheForce       : ${CacheService.cronCacheForce}`);

    const job1 = new CronJob(CacheService.cronCacheRecurrent, () => {
      this.renewCacheIfNeeded();
    });
    this._schedulerRegistry.addCronJob('cronCacheRecurrent', job1);
    job1.start();
    const job2 = new CronJob(CacheService.cronCacheForce, () => {
      this.renewCacheForced();
    });
    this._schedulerRegistry.addCronJob('cronCacheForce', job2);
    job2.start();

    CacheService.cacheTables[CacheDateKey.AUTHORS.toString()] = new CacheDate(CacheDateKey.AUTHORS, CacheService.CACHE_DIR);
    CacheService.cacheTables[CacheDateKey.BOOKS.toString()] = new CacheDate(CacheDateKey.BOOKS, CacheService.CACHE_DIR);
    CacheService.cacheTables[CacheDateKey.NEW_BOOKS.toString()] = new CacheDate(CacheDateKey.NEW_BOOKS, CacheService.CACHE_DIR);
    CacheService.cacheTables[CacheDateKey.SERIES.toString()] = new CacheDate(CacheDateKey.SERIES, CacheService.CACHE_DIR);
    CacheService.cacheTables[CacheDateKey.TAGS.toString()] = new CacheDate(CacheDateKey.TAGS, CacheService.CACHE_DIR);
  }

  renewCacheIfNeeded() {
    this._calibreDbService.getDbDate().then((dbDate) => {
      const promises: Promise<void | string>[] = [CacheDateKey.AUTHORS, CacheDateKey.BOOKS, CacheDateKey.NEW_BOOKS, CacheDateKey.SERIES, CacheDateKey.TAGS].map((key: CacheDateKey) => {
        return this.getCachePath(key, dbDate);
      });

      Promise.all(promises)
        .then(() => {
          this.logger.debug('cache renewed (if nedeed)');
        })
        .catch((reason) => {
          this.logger.error(reason);
        });
    });
  }
  renewCacheForced() {
    const dbDate = new Date(2100, 0, 1);
    const promises: Promise<void | string>[] = [CacheDateKey.AUTHORS, CacheDateKey.BOOKS, CacheDateKey.NEW_BOOKS, CacheDateKey.SERIES, CacheDateKey.TAGS].map((key: CacheDateKey) => {
      return this.getCachePath(key, dbDate);
    });

    Promise.all(promises)
      .then(() => {
        this.logger.debug('cache renewed (forced)');
      })
      .catch((reason) => {
        this.logger.error(reason);
      });
  }

  getCacheDate(key: CacheDateKey): Promise<Date> {
    return new Promise<Date>((resolve, reject) => {
      if (!CacheService.cacheTables[key]) {
        console.log(`Cache not found : '${key}'`);
        reject(`Cache not found : '${key}'`);
      } else {
        const cache = CacheService.cacheTables[key];
        const cachePath = cache.cachePath;

        fs.stat(cachePath, (err, stats) => {
          if (err && err.code != 'ENOENT') {
            console.log(err);
            reject(err);
          } else {
            if (stats) {
              resolve(stats.mtime);
            } else {
              reject(`One cache not found : '${key}'`);
            }
          }
        });
      }
    });
  }
  getCachePath(key: CacheDateKey, dbDate?: Date): Promise<string> {
    dbDate = dbDate || new Date(1);

    return new Promise<string>((resolve, reject) => {
      if (!CacheService.cacheTables[key]) {
        console.log(`Cache not found : '${key}'`);
        reject(`Cache not found : '${key}'`);
      } else {
        const cache = CacheService.cacheTables[key];
        const cachePath = cache.cachePath;

        // this.logger.debug(cachePath);
        fs.mkdirSync(path.dirname(cachePath), { recursive: true });

        fs.stat(cachePath, (err, stats) => {
          let fileDate = new Date(0);
          if (err && err.code != 'ENOENT') {
            console.log(err);
            reject(err);
          } else {
            if (stats) {
              fileDate = stats.mtime;
            }
            // if dbDate newer, recalculate
            if (dbDate.getTime() > fileDate.getTime()) {
              let promise: Promise<CacheContent[]>;
              //should be recalculate
              switch (key) {
                case CacheDateKey.BOOKS:
                  promise = this._calibreDbService.getBooks();
                  break;
                case CacheDateKey.NEW_BOOKS:
                  promise = this._calibreDbService.getBooks(200, 0);
                  break;
                case CacheDateKey.AUTHORS:
                  promise = this._calibreDbService.getAllAuthors();
                  break;
                case CacheDateKey.SERIES:
                  promise = this._calibreDbService.getAllSeries();
                  break;
                case CacheDateKey.TAGS:
                  promise = this._calibreDbService.getAllTags();
                  break;
                default:
                  reject('No cache found for ' + key);
              }
              if (promise) {
                promise
                  .then((rows) => {
                    // this.logger.debug(JSON.stringify(rows[0], null, 2));

                    // Sort with the default
                    switch (key) {
                      case CacheDateKey.BOOKS:
                        rows = rows.sort((b1: Book, b2: Book) => {
                          const v1 = (b1.series_name == null ? '' : b1.series_sort + ' ') + (b1.series_name == null ? '' : (b1.book_series_index + '').padStart(6, '0') + ' ') + b1.book_sort;
                          const v2 = (b2.series_name == null ? '' : b2.series_sort + ' ') + (b2.series_name == null ? '' : (b2.book_series_index + '').padStart(6, '0') + ' ') + b2.book_sort;
                          return v1.localeCompare(v2);
                        });
                        break;
                      case CacheDateKey.NEW_BOOKS:
                        break;
                      case CacheDateKey.AUTHORS:
                        rows = rows.sort((b1: Author, b2: Author) => {
                          const v1 = b1.author_sort ? b1.author_sort : b1.author_name;
                          const v2 = b2.author_sort ? b2.author_sort : b2.author_name;
                          return v1.localeCompare(v2);
                        });
                        break;
                      case CacheDateKey.SERIES:
                        rows = rows.sort((b1: Series, b2: Series) => {
                          const v1 = b1.series_sort;
                          const v2 = b2.series_sort;
                          return v1.localeCompare(v2);
                        });
                        break;
                      case CacheDateKey.TAGS:
                        rows = rows.sort((b1: Tag, b2: Tag) => {
                          const v1 = b1.tag_name;
                          const v2 = b2.tag_name;
                          return v1.localeCompare(v2);
                        });
                        break;
                      default:
                        reject('No cache found for ' + key);
                    }

                    // add here users loading to fill book (in books attribute, or directly in object)
                    this._calibreDbService
                      .fillBooksFromUser(rows, this._usersService.getAll(), true)
                      .then((objects: CacheContent[]) => {
                        const apiReturn: ApiReturn = {};

                        switch (key) {
                          case CacheDateKey.BOOKS:
                          case CacheDateKey.NEW_BOOKS:
                            apiReturn.books = objects as Book[];
                            break;
                          case CacheDateKey.AUTHORS:
                            apiReturn.authors = objects as Author[];
                            break;
                          case CacheDateKey.SERIES:
                            apiReturn.series = objects as Series[];
                            break;
                          case CacheDateKey.TAGS:
                            apiReturn.tags = objects as Tag[];
                            break;
                        }
                        fs.writeFile(cachePath, JSON.stringify(apiReturn), (err) => {
                          if (err) {
                            reject(err);
                          } else {
                            this.logger.debug('Cache done : ' + cachePath);
                            resolve(cachePath);
                          }
                        });
                      })
                      .catch((err) => {
                        reject(err);
                      });
                  })
                  .catch((err) => {
                    reject(err);
                  });
              }
            } else {
              //debug("No need to cache : " + cachePath);
              resolve(cachePath);
            }
          }
        });
      }
    });
  }
}

class CacheDate {
  key: CacheDateKey;
  cachePath: string;

  constructor(key: CacheDateKey, cache_dir: string) {
    this.key = key;
    this.cachePath = path.resolve(`${cache_dir}/${CacheDateKey[key]}.json`);
  }
}

export enum CacheDateKey {
  NEW_BOOKS,
  BOOKS,
  AUTHORS,
  SERIES,
  TAGS,
  values,
}

