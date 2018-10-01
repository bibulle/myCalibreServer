import DbCalibre from "./dbCalibre";
import { Author } from "./author";
import { Series } from "./series";
import { Tag } from "./tag";
import { Book } from "./book";

const fs = require('fs');
const path = require('path');
const debug = require('debug')('server:models:cache-data');
const leftPad = require('left-pad');

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
                    // Sort with the default
                    switch (key) {
                      case CacheDateKey.BOOKS:
                        rows = rows.sort((b1: Book, b2: Book) => {
                          let v1 = (b1.series_name == null ? '' : b1.series_sort + ' ') + (b1.series_name == null ? '' : leftPad(b1.book_series_index, 6, 0) + ' ') + b1.book_sort;
                          let v2 = (b2.series_name == null ? '' : b2.series_sort + ' ') + (b2.series_name == null ? '' : leftPad(b2.book_series_index, 6, 0) + ' ') + b2.book_sort;
                          return v1.localeCompare(v2);
                        });
                        break;
                      case CacheDateKey.NEW_BOOKS:
                        break;
                      case CacheDateKey.AUTHORS:
                        rows = rows.sort((b1: Author, b2: Author) => {
                          let v1 = (b1.author_sort ? b1.author_sort : b1.author_name);
                          let v2 = (b2.author_sort ? b2.author_sort : b2.author_name);
                          return v1.localeCompare(v2);
                        });
                        break;
                      case CacheDateKey.SERIES:
                        rows = rows.sort((b1: Series, b2: Series) => {
                          let v1 = b1.series_sort;
                          let v2 = b2.series_sort;
                          return v1.localeCompare(v2);
                        });
                        break;
                      case CacheDateKey.TAGS:
                        rows = rows.sort((b1: Tag, b2: Tag) => {
                          let v1 = b1.tag_name;
                          let v2 = b2.tag_name;
                          return v1.localeCompare(v2);
                        });
                        break;
                      default:
                        reject("No cache found for " + key);
                    }


                    // add here users loading to fill book (in books attribute, or directly in object)
                    Book.updateBooksFromRows(rows)
                        .then(data => {

                          // Suppress useless info in the list
                          data['data'].forEach(r => {
                            //debug(JSON.stringify(r));
                            if (r['books']) {
                              (r['books'] as Book[]).forEach(b => {
                                delete b['book_path'];
                                delete b['book_isbn'];
                                delete b['timestamp'];
                                delete b['tag_id'];
                                delete b['tag_name'];
                                delete b['comment'];
                                delete b['data'];
                                delete b['rating_id'];
                                delete b['book_sort'];
                                delete b['author_sort'];
                                delete b['author_id'];
                                delete b['history'];
                              });
                            } else {
                              delete r['book_path'];
                              delete r['book_isbn'];
                              delete r['timestamp'];
                              delete r['tag_id'];
                              delete r['tag_name'];
                              delete r['comment'];
                              delete r['data'];
                              delete r['rating_id'];
                              delete r['series_id'];
                              delete r['history'];
                            }
                            //debug(JSON.stringify(r));
                          });


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


