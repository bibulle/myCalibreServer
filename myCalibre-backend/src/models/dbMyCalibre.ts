import * as _ from "lodash";
import {Configuration} from "./configuration";
import {User} from "./user";

const debug = require('debug')('server:dbMyCalibre');

const MongoClient = require('mongodb').MongoClient;
//const MongoDb = require('mongodb').Db;
//const MongoServer = require('mongodb').Server;


const fs = require('fs');
const path = require('path');

//const sqlite3 = require("sqlite3").verbose();
//const squel = require("squel");


// try to migrate from sqlite to mongo
// create Db
//    use myCalibreDb
// create collection
//    db.createCollection("users")
// export with intellij (Option JSON-groovy.json)
// import : mongoimport -v --host localhost:27017 -d myCalibreDb -c users --jsonArray main_user.json


class DbMyCalibre {

  public static MY_CALIBRE_DIR = path.resolve(`${__dirname}/../../data/my-calibre`);
  private static MONGO_URL = 'mongodb://localhost:27017';
  private static MONGO_DB_NMAE = 'myCalibreDb';


  private static _instance: DbMyCalibre = new DbMyCalibre();

  private _mongoDb;

  constructor() {

    DbMyCalibre._instance = this;

    // Connect to MongoDb
    MongoClient.connect(DbMyCalibre.MONGO_URL, function (err, mongoClient) {
      // There is no error
      if (err) {
        throw(err);
      }
      debug("Connected correctly to mongo server");

      DbMyCalibre._instance._mongoDb = mongoClient.db(DbMyCalibre.MONGO_DB_NMAE);


    });
  }

  // private static getInstance(): Promise<DbMyCalibre> {
  //   return new Promise<DbMyCalibre>((resolve, reject) => {
  //     if (DbMyCalibre._instance && DbMyCalibre._instance._mongoDb) {
  //       // it's ready, answer
  //       resolve(DbMyCalibre._instance);
  //     }
  //     else {
  //       setTimeout(() => {
  //         // wait a second and retry
  //         DbMyCalibre.getInstance()
  //           .then(instance => {
  //             resolve(DbMyCalibre._instance);
  //           })
  //           .catch(reason => {
  //             reject(reason);
  //           })
  //
  //       }, 1000)
  //     }
  //   });
  // }

  /**
   * get configuration from Db
   * @returns {Promise<Configuration>}
   */
  public static getConf(): Promise<Configuration> {

    return new Promise<Configuration>((resolve, reject) => {

      if (DbMyCalibre._instance && DbMyCalibre._instance._mongoDb) {


        DbMyCalibre._instance._mongoDb.collection('config').findOne({}, (err, row) => {
          if (err) {
            reject(err);
          } else {
            // debug("------");
            // debug(row);
            // debug("------");
            resolve(new Configuration(row));
          }
        });
      } else {
        setTimeout(() => {
          // wait a second and retry
          DbMyCalibre.getConf()
            .then(config => {
              resolve(config);
            })
            .catch(reason => {
              reject(reason);
            })

        }, 250)
      }


    })


  }

  /**
   * get a user from Db
   * @param id
   * @returns {Promise<User>}
   */
  public static findUserById(id: string): Promise<User> {
    return DbMyCalibre._findUserBy("id", id);
  }

  /**
   * get a user from Db
   * @param username
   * @returns {Promise<User>}
   */
  public static findUserByUsername(username: string): Promise<User> {
    return DbMyCalibre._findUserBy("local.username", username);
  }

  /**
   * get a user from Db
   * @param facebookId
   * @returns {Promise<User>}
   */
  public static findByFacebookId(facebookId: string): Promise<User> {
    return DbMyCalibre._findUserBy("facebook.id", facebookId);
  }

  /**
   * get a user from Db
   * @param googleId
   * @returns {Promise<User>}
   */
  public static findByGoogleId(googleId: string): Promise<User> {
    return DbMyCalibre._findUserBy("google.id", googleId);
  }

  /**
   * get a user from Db
   * @returns {Promise<User[]>}
   * @private
   */
  public static getAllUsers(): Promise<User[]> {

    return new Promise<User[]>((resolve, reject) => {

      if (DbMyCalibre._instance && DbMyCalibre._instance._mongoDb) {
        DbMyCalibre._instance._mongoDb.collection('users').find({}).toArray((err, rows) => {
          if (err) {
            reject(err);
          } else {
            const users = rows.map(r => {
              let options = {};
              _.forEach(r, (value, key) => {
                _.set(options, key, value);
              });
              return new User(options)
            });
            resolve(users);
          }
        })
      } else {
        setTimeout(() => {
          // wait a second and retry
          DbMyCalibre.getAllUsers()
            .then(users => {
              resolve(users);
            })
            .catch(reason => {
              reject(reason);
            })

        }, 250)
      }
    })

  }

  /**
   * get a user from Db
   * @param fieldName
   * @param value
   * @returns {Promise<User>}
   * @private
   */
  private static _findUserBy(fieldName: string, value: string): Promise<User> {

    return new Promise<User>((resolve, reject) => {

      let query = {};
      query[fieldName] = value;

      if (DbMyCalibre._instance && DbMyCalibre._instance._mongoDb) {
        DbMyCalibre._instance._mongoDb.collection('users').findOne(query, (err, row) => {
          if (err) {
            reject(err);
          } else {
            if (row) {

              // let options = {};
              // console.log(row);
              // _.forEach(row, (value, key) => {
              //   _.set(options, key, value);
              // });
              // console.log(options);

              resolve(new User(row));
            } else {
              resolve(null);
            }
          }
        })
      } else {
        setTimeout(() => {
          // wait a second and retry
          DbMyCalibre._findUserBy(fieldName, value)
            .then(user => {
              resolve(user);
            })
            .catch(reason => {
              reject(reason);
            })

        }, 250)
      }
    })

  }

  /**
   * Delete a user
   * @param user
   * @returns {Promise<User>}
   */
  public static deleteUser(user: User): Promise<void> {
    return new Promise<void>((resolve, reject) => {

      let query = {};
      query['id'] = user.id;

      if (DbMyCalibre._instance && DbMyCalibre._instance._mongoDb) {
        DbMyCalibre._instance._mongoDb.collection('users').deleteOne(query, (err, result) => {
          if (err) {
            reject(err);
          } else {
            debug("user deleted " + user.local.username + " " + user.local.firstname + " " + user.local.lastname + " (" + result + ")")

            resolve();
          }
        })
      } else {
        setTimeout(() => {
          // wait a second and retry
          DbMyCalibre.deleteUser(user)
            .then(() => {
              resolve();
            })
            .catch(reason => {
              reject(reason);
            })

        }, 250)
      }
    })
  }

  /**
   * Save a user
   */
  public static saveUser(user: User, tryInsert: boolean): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._updateUser(user, resolve, reject, tryInsert);
    })
  }

  private static _updateUser(user: User, resolve, reject, tryInsert: boolean) {
    let filter = {};
    filter['id'] = user.id;

    //debug(user);
    delete user['_id'];
    //debug(user);

    if (DbMyCalibre._instance && DbMyCalibre._instance._mongoDb) {
      // DbMyCalibre._instance._mongoDb.collection('users').updateOne(filter, {$set: user}, {upsert: tryInsert}, (err, result) => {
      DbMyCalibre._instance._mongoDb.collection('users').replaceOne(filter, user, {upsert: tryInsert}, (err, result) => {
        if (err) {
          debug(err);
          reject(err);
        } else {
          debug("user updated " + user.local.username + " " + user.local.firstname + " " + user.local.lastname + " (" + result + ")")

          resolve();
        }
      })
    } else {
      setTimeout(() => {
        // wait a second and retry
        DbMyCalibre._updateUser(user, resolve, reject, tryInsert);

      }, 250)
    }
  }

  private static _insertUser(user, resolve, reject) {
    // const query = squel
    //   .insert({separator: "\n"})
    //   .into("user")
    //   .set('id', user.id)
    //   .set('local_username', user.local.username)
    //   .set('local_firstname', user.local.firstname)
    //   .set('local_lastname', user.local.lastname)
    //   .set('local_email', user.local.email)
    //   .set('local_isAdmin', user.local.isAdmin ? 1 : 0)
    //   .set("local_hashedPassword", user.local.hashedPassword)
    //   .set("local_salt", user.local.salt)
    //   .set('local_amazon_emails', user.local.amazonEmails.join('|'))
    //   .set('facebook_id', user.facebook.id)
    //   .set('facebook_token', user.facebook.token)
    //   .set('facebook_email', user.facebook.email)
    //   .set('facebook_name', user.facebook.name)
    //   .set('twitter_id', user.twitter.id)
    //   .set('twitter_token', user.twitter.token)
    //   .set('twitter_displayName', user.twitter.displayName)
    //   .set('twitter_username', user.twitter.username)
    //   .set('google_id', user.google.id)
    //   .set('google_token', user.google.token)
    //   .set('google_email', user.google.email)
    //   .set('google_name', user.google.name)
    // ;
    //
    // //debug(query.toString());
    // this._db.run(query.toString(), function (err) {
    //   if (err) {
    //     console.log(err);
    //     reject(err);
    //   } else {
    //     debug("user created " + user.id + " (" + this.changes + ")");
    //     resolve();
    //   }
    //
    // })
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
