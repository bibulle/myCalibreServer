import * as _ from "lodash";
import { Configuration } from "./configuration";
import { User } from "./user";
import DbCalibre from "./dbCalibre";
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

  constructor () {

    debug("Opening '" + DbMyCalibre.DB_FILE + "'");

    try {
      this._db = new sqlite3.Database(DbMyCalibre.DB_FILE);
    } catch (error) {
      throw(error);
    }
    if (DbMyCalibre._instance) {
      throw new Error("Error: Instantiation failed: Use DbMyCalibre.getInstance() instead of new.");
    }
    DbMyCalibre._instance = this;

  }

  public static getInstance (): DbMyCalibre {
    return DbMyCalibre._instance;
  }

  /**
   * get configuration from Db
   * @returns {Promise<Configuration>}
   */
  public getConf (): Promise<Configuration> {

    return new Promise<Configuration>((resolve, reject) => {

      const query = squel
        .select({ separator: "\n" })

        // bookFields
        .field('config.smtp_user_name', 'smtp_user_name')
        .field('config.smtp_password', 'smtp_password')
        .field('config.smtp_server_name', 'smtp_server_name')
        .field('config.smtp_port', 'smtp_port')
        .field('config.smtp_encryption', 'smtp_encryption')
        .field('config.authent_secret', 'authent_secret')
        .field('config.authent_length', 'authent_length')
        .field('config.authent_digest', 'authent_digest')

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

  /**
   * get a user from Db
   * @returns {Promise<User>}
   */
  public findUserByEmail (email: string): Promise<User> {

    return new Promise<User>((resolve, reject) => {

      //const whereValue = DbCalibre._makeWhere('config', email, 'local_email', '_');
      //debug(whereValue);
      //const where = whereValue[0];
      //const value = whereValue[1];

      const query = squel
        .select({ separator: "\n" })

        // bookFields
        .field('user.local_email', 'local.email')
        .field('user.local_hashedPassword', 'local.hashedPassword')
        .field('user.local_salt', 'local.salt')

        .from('user')
        .where("local_email = ?", email);

      this._db.get(query.toString(), (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row) {

            var options = {};
            _.forEach(row, (value, key) => {
              _.set(options, key, value);
            });

            resolve(new User(options));
          } else {
            resolve(null);
          }
        }
      })
    })

  }

  /**
   * Save a user
   */
  public saveUser (user: User): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._updateUser(user, resolve, reject);
    })
  }

  private _updateUser (user, resolve, reject) {
    const query = squel
      .update({ separator: "\n" })
      .table("user")
      .set("local_email", user.local.email)
      .set("local_hashedPassword", user.local.hashedPassword)
      .set("local_salt", user.local.salt)
      .set("updated", "current_timestamp", { dontQuote: true })

      .where("local_email = ?", user.local.email);

    debug(query.toString());
    const that = this;
    this._db.run(query.toString(), function (err) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        if (this.changes == 0) {
          that._insertUser(user, resolve, reject);
        } else {
          debug("user updated " + user.local.email + " (" + this.changes + ")");
          resolve();
        }
      }

    })
  }

  private _insertUser (user, resolve, reject) {
    const query = squel
      .insert({ separator: "\n" })
      .into("user")
      .set("local_email", user.local.email)
      .set("local_hashedPassword", user.local.hashedPassword)
      .set("local_salt", user.local.salt)
      //.set("updated", "current_timestamp", { dontQuote: true })
      ;

    //debug(query.toString());
    this._db.run(query.toString(), function (err) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        debug("user created " + user.local.email + " (" + this.changes + ")");
        resolve();
      }

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
