import * as _ from "lodash";
import {Configuration} from "./configuration";
import {User} from "./user";
const debug = require('debug')('server:dbMyCalibre');

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
        .field('config.authent_secret', 'authent_secret')
        .field('config.authent_length', 'authent_length')
        .field('config.authent_digest', 'authent_digest')
        .field('config.authent_facebook_clientID', 'authent_facebook_clientID')
        .field('config.authent_facebook_clientSecret', 'authent_facebook_clientSecret')
        .field('config.authent_facebook_callbackURL', 'authent_facebook_callbackURL')

        .field('config.authent_twitter_consumerKey', 'authent_twitter_consumerKey')
        .field('config.authent_twitter_consumerSecret', 'authent_twitter_consumerSecret')
        .field('config.authent_twitter_callbackURL', 'authent_twitter_callbackURL')

        .field('config.authent_google_clientID', 'authent_google_clientID')
        .field('config.authent_google_clientSecret', 'authent_google_clientSecret')
        .field('config.authent_google_callbackURL', 'authent_google_callbackURL')


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
   * @param id
   * @returns {Promise<User>}
   */
  public findUserById(id: string): Promise<User> {
    return this._findUserBy("id", id);
  }

  /**
   * get a user from Db
   * @param username
   * @returns {Promise<User>}
   */
  public findUserByUsername(username: string): Promise<User> {
    return this._findUserBy("local_username", username);
  }

  /**
   * get a user from Db
   * @param facebookId
   * @returns {Promise<User>}
   */
  public findByFacebookId(facebookId: string): Promise<User> {
    return this._findUserBy("facebook_id", facebookId);
  }

  /**
   * get a user from Db
   * @param googleId
   * @returns {Promise<User>}
   */
  public findByGoogleId(googleId: string): Promise<User> {
    return this._findUserBy("google_id", googleId);
  }

  /**
   * get a user from Db
   * @param fieldName
   * @param value
   * @returns {Promise<User>}
   * @private
   */
  private _findUserBy(fieldName: string, value: string): Promise<User> {

    return new Promise<User>((resolve, reject) => {

      const query = squel
        .select({separator: "\n"})

        // bookFields
        .field('user.id', 'id')
        .field('user.local_username', 'local.username')
        .field('user.local_firstname', 'local.firstname')
        .field('user.local_lastname', 'local.lastname')
        .field('user.local_email', 'local.email')
        .field('user.local_isAdmin', 'local.isAdmin')
        .field('user.local_hashedPassword', 'local.hashedPassword')
        .field('user.local_salt', 'local.salt')
        .field('user.local_amazon_emails', 'local.amazonEmails')
        .field('user.facebook_id', 'facebook.id')
        .field('user.facebook_token', 'facebook.token')
        .field('user.facebook_email', 'facebook.email')
        .field('user.facebook_name', 'facebook.name')
        .field('user.twitter_id', 'twitter.id')
        .field('user.twitter_token', 'twitter.token')
        .field('user.twitter_displayName', 'twitter.displayName')
        .field('user.twitter_username', 'twitter.username')
        .field('user.google_id', 'google.id')
        .field('user.google_token', 'google.token')
        .field('user.google_email', 'google.email')
        .field('user.google_name', 'google.name')

        .from('user')
        .where(fieldName + " = ?", value);

      this._db.get(query.toString(), (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row) {

            let options = {};
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
   * Delete a user
   * @param user
   * @returns {Promise<User>}
   */
  public deleteUser(user: User) {
    return new Promise<User>((resolve, reject) => {
      const query = squel
        .remove({separator: "\n"})
        .from("user")
        .where("id = ?", user.id);

      //debug(query.toString());
      this._db.run(query.toString(), function (err) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          debug("user deleted " + user.local.username + " (" + this.changes + ")");
          resolve();
        }

      })
    })
  }

  /**
   * Save a user
   */
  public saveUser(user: User, tryInsert: boolean): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._updateUser(user, resolve, reject, tryInsert);
    })
  }

  private _updateUser(user: User, resolve, reject, tryInsert: boolean) {
    const query = squel
      .update({separator: "\n"})
      .table("user")
      .set('id', user.id)
      .set('local_username', user.local.username)
      .set('local_firstname', user.local.firstname)
      .set('local_lastname', user.local.lastname)
      .set('local_email', user.local.email)
      .set('local_isAdmin', user.local.isAdmin)
      .set("local_hashedPassword", user.local.hashedPassword)
      .set("local_salt", user.local.salt)
      .set('local_amazon_emails', user.local.amazonEmails.join('|'))
      .set('facebook_id', user.facebook.id)
      .set('facebook_token', user.facebook.token)
      .set('facebook_email', user.facebook.email)
      .set('facebook_name', user.facebook.name)
      .set('twitter_id', user.twitter.id)
      .set('twitter_token', user.twitter.token)
      .set('twitter_displayName', user.twitter.displayName)
      .set('twitter_username', user.twitter.username)
      .set('google_id', user.google.id)
      .set('google_token', user.google.token)
      .set('google_email', user.google.email)
      .set('google_name', user.google.name)
      .set("updated", "current_timestamp", {dontQuote: true})

      .where("id = ?", user.id);

    //debug(query.toString());
    const that = this;
    this._db.run(query.toString(), function (err) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        if (tryInsert && (this.changes == 0)) {
          that._insertUser(user, resolve, reject);
        } else {
          debug("user updated " + user.local.username + " (" + this.changes + ")");
          resolve();
        }
      }

    })
  }

  private _insertUser(user, resolve, reject) {
    const query = squel
      .insert({separator: "\n"})
      .into("user")
      .set('id', user.id)
      .set('local_username', user.local.username)
      .set('local_firstname', user.local.firstname)
      .set('local_lastname', user.local.lastname)
      .set('local_email', user.local.email)
      .set('local_isAdmin', user.local.isAdmin)
      .set("local_hashedPassword", user.local.hashedPassword)
      .set("local_salt", user.local.salt)
      .set('local_amazon_emails', user.local.amazonEmails.join('|'))
      .set('facebook_id', user.facebook.id)
      .set('facebook_token', user.facebook.token)
      .set('facebook_email', user.facebook.email)
      .set('facebook_name', user.facebook.name)
      .set('twitter_id', user.twitter.id)
      .set('twitter_token', user.twitter.token)
      .set('twitter_displayName', user.twitter.displayName)
      .set('twitter_username', user.twitter.username)
      .set('google_id', user.google.id)
      .set('google_token', user.google.token)
      .set('google_email', user.google.email)
      .set('google_name', user.google.name)
    ;

    //debug(query.toString());
    this._db.run(query.toString(), function (err) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        debug("user created " + user.id + " (" + this.changes + ")");
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
