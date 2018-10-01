import DbCalibre from "./dbCalibre";
import { Author } from "./author";
import { Series } from "./series";
import { Tag } from "./tag";
import { Book } from "./book";

const fs = require('fs');
const path = require('path');
const debug = require('debug')('server:models:cache-data');

export class CacheDate {

  static NUM_BY_PAGE = 500;
  static NUM_NEW_BOOKS = 200;

  key: CacheDateKey;
  cachePathMask: string;

  constructor (key: CacheDateKey) {
    this.key = key;
    this.cachePathMask = path.resolve(`${__dirname}/../../data/my-calibre/cache/${CacheDateKey[key]}_@NUM@.json`);
  }

  calcPath (pageNum: number): string {
    return this.cachePathMask.replace(
      "@NUM@",
      ("0".repeat(7) + pageNum).substr(-7, 7)
    )
  }


  static getCachePath (key: CacheDateKey, pageNum: number, dbDate?: Date): Promise<string> {
    dbDate = dbDate || new Date(1);

    return new Promise<string>((resolve, reject) => {
      if (!CacheDate.cacheTables[key]) {
        console.log(`Cache not found : '${key}'`);
        reject(`Cache not found : '${key}'`);
      } else {
        const cache = CacheDate.cacheTables[key];
        let cachePath = cache.calcPath(pageNum);

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
                  promise = DbCalibre.getInstance().getBooks(CacheDate.NUM_NEW_BOOKS, 0);
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
                        .then((data) => {

                          //console.log(data);
                          let list: any[] = data["data"];
                          let pageNum = 1;
                          let pages = [];

                          list.forEach(r => {
                            if (pages.length < pageNum) {
                              pages.push([]);
                            } else if (pages[pageNum - 1].length % CacheDate.NUM_BY_PAGE == 0) {
                              pageNum++;
                              pages.push([]);
                            }
                            pages[pageNum - 1].push(r);
                          });

                          pageNum = 1;
                          pages.forEach(p => {
                            fs.writeFileSync(
                                cache.calcPath(pageNum),
                                JSON.stringify({
                                    lastUpdated: data["lastUpdated"],
                                    numByPage: CacheDate.NUM_BY_PAGE,
                                    pageNum: pageNum,
                                    pageCount: Math.ceil(list.length / CacheDate.NUM_BY_PAGE),
                                    data: pages[pageNum - 1]
                                  }
                                ))
                              ;
                              pageNum++;
                          });
                          debug(CacheDateKey[key]+" : "+pages.length+" pages created");
                          resolve(cachePath);

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


