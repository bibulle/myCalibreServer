#!/usr/bin/env node
import { CacheDate } from "../models/cacheDate";
import DbCalibre from "../models/dbCalibre";
const debug = require('debug')('server:prepare-cache');
const CronJob = require('cron').CronJob;
const async = require('async');


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
//      for (var key in CacheDate.cacheTables) {
//        if (CacheDate.cacheTables.hasOwnProperty(key)) {
//          CacheDate.getCachePath(key, dbDate);
//        }
//      }

//      DbMyCalibre
//        .getInstance()
//        .getCaches()
//        .then(caches => {
//          var cacheTable: { [key: string]: CacheDate; } = {};
//          caches.forEach(cache => {
//            cacheTable[cache.key] = cache;
//          })
//          for (var key in CacheDate.cacheTables) {
//            if (CacheDate.cacheTables.hasOwnProperty(key)) {
//              cacheTable[key] = new CacheDate(key);
//            }
//          }
//
//          // check date
//          for (var key in cacheTable) {
//            if (cacheTable.hasOwnProperty(key)) {
//              var cache = cacheTable[key];
//
//              if (!cache.date || cache.date < dbDate) {
//                debug(cache);
//              }
//            }
//          }
//
//        })
//        .catch(err => {
//          debug("ERROR checkCache !!")
//          debug(err);
//        })
    })
    .catch(err => {
      debug("ERROR checkCache !!");
      debug(err);
    })
}


checkCache();
//========================================================================
new CronJob(CRON_TAB_CACHE_CHECK, checkCache, null, true, "GMT");
//========================================================================
