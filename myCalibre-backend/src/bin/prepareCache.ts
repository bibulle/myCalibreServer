#!/usr/bin/env node
import { CacheDate } from "../models/cacheDate";
import DbCalibre from "../models/dbCalibre";
import { Series } from "../models/series";
const debug = require('debug')('server:prepare-cache');
const CronJob = require('cron').CronJob;
const async = require('async');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');


debug('Starting.....');
process.chdir(`${__dirname}/../..`);

const CRON_TAB_CACHE_CHECK = '* */30 * * * *';
debug("CronTab          : '" + CRON_TAB_CACHE_CHECK + "'");

let _checkCacheStarted = false;

function checkCache () {
  //debug("chechCache");
  if (_checkCacheStarted) {
    return;
  }
  _checkCacheStarted = true;

  async.series([
      (callback1) => {
        // =================
        // calculate requests cache
        // =================
        DbCalibre
          .getInstance()
          .getDbDate()
          .then((dbDate) => {
            //debug(dbDate);

            // just ask for path foreach cache
            async.forEachLimit(
              CacheDate.cacheTables,
              2,
              (item, callback) => {
                CacheDate.getCachePath(item.key, dbDate)
                         .then(() => {
                           callback(null);
                         })
                         .catch((err) => {
                           callback(err);
                         });

              },
              (err) => {
                if (err) {
                  console.log(err);
                  callback1(err);
                } else {
            //debug("requests done");
                  callback1();
                }
              });
          })
          .catch(err => {
            debug("ERROR checkCache !!");
            callback1(err);
          });
      },
      (callback1) => {
        // =================
        // calculate books thumbnail
        // =================
        DbCalibre
          .getInstance()
          .getBooks()
          .then(books => {
            async.eachSeries(
              books,
              (book, callback) => {
                //debug(book.book_id);
                if (book.book_has_cover) {
                  const coverPath = book.getCoverPath();
                  let coverStats;
                  try {
                    coverStats = fs.statSync(coverPath);
                  } catch (e) {
                  }
                  const coverDate = (coverStats ? coverStats.mtime : null);

                  const thumbnailPath = book.getThumbnailPath();
                  let thumbnailStats;
                  try {
                    thumbnailStats = fs.statSync(thumbnailPath);
                  } catch (e) {
                  }
                  const thumbnailDate = (thumbnailStats ? thumbnailStats.mtime : new Date(0));

                  if (coverDate && coverDate.getTime() > thumbnailDate.getTime()) {
                    debug("calculate book thumbnail : " + book.book_title);

                    mkdir_p(path.dirname(thumbnailPath));

                    sharp(coverPath)
                      .resize(null, 160)
                      .toFile(thumbnailPath, function (err: string) {
                        if (err) {
                          debug(err);
                          callback(err);
                        } else {
                          //debug(info);
                          process.nextTick(callback)
                        }
                      });

                  } else {
                    process.nextTick(callback)
                  }
                } else {
                  process.nextTick(callback)
                }
              },
              err => {
                if (err) {
                  debug("ERROR : " + err);
                  callback1(err);
                } else {
                  //debug("books done");
                  callback1();
                }
              }
            )

          })
          .catch(err => {
            debug("ERROR checkCache !!");
            debug(err);
            callback1(err);
          })
      },
      (callback) => {
        // =================
        // calculate series thumbnails
        // =================
        Series.getAllSeries()
              .then(seriesLst => {

                async.eachSeries(
                  seriesLst,
                  (series, callback) => {
                    const thumbnailPath = series.getThumbnailPath();
                    let thumbnailStats;
                    try {
                      thumbnailStats = fs.statSync(thumbnailPath);
                    } catch (e) {
                    }
                    const thumbnailDate = (thumbnailStats ? thumbnailStats.mtime : new Date(0));

                    let coversDate = new Date(1);
                    series.books.forEach(book => {
                      const coverPath = book.getCoverPath();
                      try {
                        const coverStats = fs.statSync(coverPath);
                        if (coverStats && (coverStats.mtime.getTime() > coversDate.getTime())) {
                          coversDate = coverStats.mtime;
                        }
                      } catch (e) {
                      }
                    });

//            if (series.series_id == 1) {
                    if (coversDate.getTime() > thumbnailDate.getTime()) {
                      // let's calculate the thumbnail

                      mkdir_p(path.dirname(thumbnailPath));

                      debug("calculate series thumbnail : " + series.series_name + " (" + series.books.length + " books)");

                      const INITIAL_HEIGHT = 160;
                      const INITIAL_STEP_INCREMENT = 10;
                      let height = INITIAL_HEIGHT;
                      let width = 0;
                      let step_increment = INITIAL_STEP_INCREMENT;
                      let step = -1 * step_increment;
                      let theBuffer = null;

                      async.eachSeries(
                        series.books,
                        (book, callback) => {
                          step += step_increment;
                          height += step;
//                  height -= step;
                          if (!theBuffer) {

                            sharp(book.getCoverPath())
                              .resize(null, height)
                              .background({r: 0, g: 0, b: 0, alpha: 0})
                              .embed()
                              .toFormat(sharp.format.png)
                              .toBuffer((err, buffer, info) => {
                                if (err) {
                                  callback(err);
                                } else {
//                          console.log('========');
//                          debug(info);
//                          console.log('========');
                                  width = info.width;
                                  theBuffer = buffer;
                                  callback();
                                }
                              });
                          } else {
                            sharp(book.getCoverPath())
                              .resize(null, height)
                              .background({r: 0, g: 0, b: 0, alpha: 0})
                              .embed()
                              .toFormat(sharp.format.png)
                              .toBuffer((err, buffer, info) => {
                                if (err) {
                                  return callback(err)
                                }
//                          console.log(info);
//                          debug(step);
//                          debug({
//                            top: step / 2,
//                            bottom: step / 2,
//                            left: 0,
//                            right: Math.max(0, step + info.width - width)
//                          });
                                sharp(theBuffer)
                                  .background({r: 0, g: 0, b: 0, alpha: 0})
                                  .extend({
                                    top: step / 2,
                                    bottom: step / 2,
                                    left: 0,
                                    right: Math.max(0, step + info.width - width)
                                  })
                                  .overlayWith(buffer, {top: 0, left: step})
                                  //.extend({top: 0, bottom: 0, left: 0, right: Math.max(0, step + info.width - width)})
                                  //.overlayWith(buffer, {top: step / 2, left: step})
                                  .toBuffer((err, buffer, info) => {
                                    if (err) {
                                      callback(err);
                                    } else {
//                              debug(info);
                                      if (info.height > 10 * INITIAL_HEIGHT) {
                                        //debug("height to big, resize " + info.height + " " + height);
                                        height = Math.round(height / 10);
                                        step = Math.round(step / 10);
                                        step = step + (step % 2);
                                        step_increment = Math.ceil(step_increment/10);
                                        step_increment = step_increment + (step_increment %2);
                                          //debug("     "+height+" "+step);
                                        sharp(buffer)
                                          .resize(null, height)
                                          .toBuffer((err, buffer, info) => {
                                            if (err) {
                                              callback(err);
                                            } else {
                                              //debug(info);
                                              width = info.width;
                                              theBuffer = buffer;
                                              callback();
                                            }
                                          });
                                      } else {
                                        width = info.width;
                                        theBuffer = buffer;
                                        callback();
                                      }
                                    }
                                  });
                              })
                          }
                        },
                        (err) => {
                          if (err) {
                            console.log(err);
                            callback(err);
                          }
                          sharp(theBuffer)
                            .toFormat(sharp.format.png)
                            .toFile(thumbnailPath, (err) => {
                              if (err) {
                                debug(err);
                                callback(err);
                              } else {
                                //debug(thumbnailPath + " done");
                                process.nextTick(callback);
                                //debug(info);
                              }
                            });
                        });
                    } else {
                      process.nextTick(callback);
                    }


                  },
                  err => {
                    if (err) {
                      debug("ERROR : " + err);
                      callback(err);
                    } else {
                      //debug("series done");
                      callback();
                    }
                  });
              })
              .catch(err => {
                debug("ERROR checkCache !!");
                debug(err);
                callback(err);
              })
      }
    ],
    (err) => {
      if (err) {
        debug("ERROR: " + err);
      }
      _checkCacheStarted = false;
    })


}

function mkdir_p (dirPath: string) {
  if (fs.existsSync(dirPath)) {
    return
  }
  mkdir_p(path.dirname(dirPath));
  fs.mkdirSync(dirPath);
}

checkCache();
//========================================================================
new CronJob(CRON_TAB_CACHE_CHECK, checkCache, null, true, "GMT");
//========================================================================
