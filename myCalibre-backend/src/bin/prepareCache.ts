#!/usr/bin/env node
import { CacheDate } from "../models/cacheDate";
import DbCalibre from "../models/dbCalibre";
const debug = require('debug')('server:prepare-cache');
const CronJob = require('cron').CronJob;
const async = require('async');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');


debug('Starting.....');
process.chdir(`${__dirname}/../..`);

const CRON_TAB_CACHE_CHECK = '0 * * * * *';
debug("CronTab          : '" + CRON_TAB_CACHE_CHECK + "'");


function checkCache () {
//  debug("chechCache");
  // get Db date
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
          } else {
//            debug("done");
          }
        });
    })
    .catch(err => {
      debug("ERROR checkCache !!");
      debug(err);
    });

  DbCalibre
    .getInstance()
    .getBooks()
    .then(books => {
      books.forEach(book => {
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

          if(coverDate && coverDate.getTime() > thumbnailDate.getTime()) {
            debug("calculate thumbnail : "+book.book_title);

            mkdir_p(path.dirname(thumbnailPath));

            sharp(coverPath)
              .resize(null, 160)
              .toFile(thumbnailPath, function(err:string) {
                if (err && !err.startsWith('vips warning')) {
                  debug(err);
                } else {
                  //debug(info);
                }
              });

          }
        }
      });
    })
    .catch(err => {
      debug("ERROR checkCache !!");
      debug(err);
    })
}

function mkdir_p(dirPath: string) {
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
