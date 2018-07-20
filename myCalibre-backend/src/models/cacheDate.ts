import DbCalibre from "./dbCalibre";
import { Author } from "./author";
import { Series } from "./series";
import { Tag } from "./tag";
import { Book } from "./book";

const fs = require('fs');
const path = require('path');
const debug = require('debug')('server:models:cache-data');

export class CacheDate {

  key: CacheDateKey;
  cachePath: string;

  constructor (key: CacheDateKey) {
    this.key = key;
    this.cachePath = path.resolve(`${__dirname}/../../data/my-calibre/cache/${CacheDateKey[key]}.json`);
  }


  static getCachePath (key: CacheDateKey, dbDate?: Date): Promise<string> {
    dbDate = dbDate || new Date(1);

    return new Promise<string>((resolve, reject) => {
      if (!CacheDate.cacheTables[key]) {
        console.log(`Cache not found : '${key}'`);
        reject(`Cache not found : '${key}'`);
      } else {
        const cache = CacheDate.cacheTables[key];
        const cachePath = cache.cachePath;

        fs.mkdir(path.dirname(cachePath), () => {
        });

        fs.stat(cachePath, function (err, stats) {
          let fileDate = new Date(0);
          if (err && (err.code != 'ENOENT')) {
            console.log(err);
            reject(err);
          } else {
            if (stats) {
              fileDate = stats.mtime;
            }

            // if dbDate newer, recalculate
            if (dbDate.getTime() > fileDate.getTime()) {
              let promise: Promise<any[]>;
              //should be recalculate
              switch (key) {
                case CacheDateKey.BOOKS:
                  promise = DbCalibre.getInstance().getBooks();
                  break;
                case CacheDateKey.NEW_BOOKS:
                  promise = DbCalibre.getInstance().getBooks(200, 0);
                  break;
                case CacheDateKey.AUTHORS:
                  promise = Author.getAllAuthors();
                  break;
                case CacheDateKey.SERIES:
                  promise = Series.getAllSeries();
                  break;
                case CacheDateKey.TAGS:
                  promise = Tag.getAllTags();
                  break;
                default:
                  reject("No cache found for " + key);
              }
              if (promise) {
                promise
                  .then(rows => {

                    // add here users loading to fill book (in books attribute, or directly in object)
                    Book.updateBooksFromRows(rows)
                        .then(data => {
                          fs.writeFile(cachePath, JSON.stringify(data),
                            err => {
                              if (err) {
                                reject(err);
                              } else {
                                debug("Cache done : " + cachePath);
                                resolve(cachePath);
                              }
                            });

                        })
                        .catch(err => {
                          reject(err);
                        })

                  })
                  .catch(err => {
                    reject(err);
                  })
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

  static cacheTables = {}


}

export enum CacheDateKey {
  NEW_BOOKS, BOOKS, AUTHORS, SERIES, TAGS
}

CacheDate.cacheTables[CacheDateKey.AUTHORS] = new CacheDate(CacheDateKey.AUTHORS);
CacheDate.cacheTables[CacheDateKey.BOOKS] = new CacheDate(CacheDateKey.BOOKS);
CacheDate.cacheTables[CacheDateKey.NEW_BOOKS] = new CacheDate(CacheDateKey.NEW_BOOKS);
CacheDate.cacheTables[CacheDateKey.SERIES] = new CacheDate(CacheDateKey.SERIES);
CacheDate.cacheTables[CacheDateKey.TAGS] = new CacheDate(CacheDateKey.TAGS);


