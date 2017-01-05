import { Configuration } from "./configuration";
const debug = require('debug')('server:dbCalibre');

const fs = require('fs');
const path = require('path');

const sqlite3 = require("sqlite3").verbose();
const squel = require("squel");

class DbMyCalibre {

  public static MY_CALIBRE_DIR = path.resolve(`${__dirname}/../../data/my-calibre`);
  private static DB_FILE = `${DbMyCalibre.MY_CALIBRE_DIR}/my-calibre.db`;

  private static _instance: DbMyCalibre = new DbMyCalibre();

  private _db;

  constructor() {

    debug("Opening '"+DbMyCalibre.DB_FILE+"'");

    try {
      this._db = new sqlite3.Database(DbMyCalibre.DB_FILE);
    } catch (error) {
      throw(error);
    }
    if (DbMyCalibre._instance) {
      throw new Error("Error: Instantiation failed: Use DbMyCalibre.getInstance() instead of new.");
    }
    DbMyCalibre._instance = this;

    //fs.stat(DB_FILE, function (err, stats) {
    //  if (err) {
    //    console.log(err);
    //  } else {
    //    console.log('stats: ' + JSON.stringify(stats));
    //    debug(stats);
    //  }
    //});
  }

  public static getInstance(): DbMyCalibre {
    return DbMyCalibre._instance;
  }

  /**
   * get configuration from Db
   * @returns {Promise<Configuration>}
   */
  public getConf(): Promise<Configuration> {

    return new Promise<Configuration>((resolve, reject) => {

      const query = squel
        .select({separator: "\n"})

        // bookFields
        .field('config.smtp_user_name', 'smtp_user_name')
        .field('config.smtp_password', 'smtp_password')
        .field('config.smtp_server_name', 'smtp_server_name')
        .field('config.smtp_port', 'smtp_port')
        .field('config.smtp_encryption', 'smtp_encryption')

        .from('config');

      this._db.get(query.toString(), (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(new Configuration(row));
        }
      })
    })

  }

//  /**
//   * get cache dates from Db
//   * @returns {Promise<CacheDate[]>}
//   */
//  public getCaches(): Promise<CacheDate[]> {
//
//    return new Promise<CacheDate[]>((resolve, reject) => {
//
//      const query = squel
//        .select({separator: "\n"})
//
//        // Fields
//        .field('cache_date.key', 'key')
//        .field('cache_date.date', 'date')
//
//        .from('cache_date');
//
//      this._db.all(query.toString(), (err, row) => {
//        if (err) {
//          console.log(err);
//          reject(err);
//        } else {
//          const cacheDates = row.map(b => {
//            return new CacheDate(b)
//          });
//          resolve(cacheDates);
//        }
//      })
//    })
//
//  }
//
//  public setCache(cacheDate: CacheDate): Promise<void> {
//    return new Promise<void>((resolve, reject) => {
//      const query = squel
//        .update({separator: "\n"})
//        .table("cache-date")
//        .set("cache-date.key", cacheDate.key)
//        .set("cache-date.date", cacheDate.date);
//
//      this._db.run(query.toString(), function(err) {
//        if (err) {
//          console.log(err);
//          reject(err);
//        } else {
//          console.log(this.changes);
//          resolve();
//        }
//      })
//    });
//
//}

}

export default DbMyCalibre
