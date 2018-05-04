import DbCalibre from "./dbCalibre";
import { Author } from "./author";
import { Series } from "./series";
import { Tag } from "./tag";
import DbMyCalibre from "./dbMyCalibre";
import {Book, BookDownloaded, BookRating} from "./book";
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

                    // TODO add here users loading to feel book (in books attribute, or directly in object)
                    DbMyCalibre.getAllUsers()
                      .then(users => {

                        let downloadedBooksById: { [id: string] : BookDownloaded[]; } = {};
                        let ratingsById: { [id: string] : BookRating[]; } = {};
                        for (let i = 0; i < users.length; i++) {
                          let user = users[i];
                          for (let j = 0; j < user.history.downloadedBooks.length; j++) {
                            let b = user.history.downloadedBooks[j];
                            if (!downloadedBooksById[b.id]) {
                              downloadedBooksById[b.id] = [];
                            }
                            downloadedBooksById[b.id].push({
                              date: b.date,
                              user_id: user.id,
                              user_name: ((user.local && (user.local.firstname || user.local.lastname)) ? user.local.firstname + ' ' + user.local.lastname : user.local.username)
                            });
                          }
                          for (let j = 0; j < user.history.ratings.length; j++) {
                            let b = user.history.ratings[j];
                            if (!ratingsById[b.book_id]) {
                              ratingsById[b.book_id] = [];
                            }
                            ratingsById[b.book_id].push({
                              rating: b.rating,
                              date: b.date,
                              user_id: user.id,
                              user_name: ((user.local && (user.local.firstname || user.local.lastname)) ? user.local.firstname + ' ' + user.local.lastname : user.local.username)
                            });
                          }
                        }

                        if ((rows.length > 0) && rows[0]['books']) {
                          for (let i = 0; i < rows.length; i++) {
                            Book.updateBooksFromUsers(rows[i]['books'], downloadedBooksById, ratingsById);
                          }
                        } else {
                          Book.updateBooksFromUsers(rows, downloadedBooksById, ratingsById);
                        }


                        fs.writeFile(cachePath, JSON.stringify({data: rows}), err => {
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


