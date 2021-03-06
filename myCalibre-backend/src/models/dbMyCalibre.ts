import * as _ from "lodash";
import {Configuration} from "./configuration";
import {User} from "./user";

const debug = require('debug')('server:dbMyCalibre');

const MongoClient = require('mongodb').MongoClient;


const path = require('path');



// try to migrate from sqlite to mongo
// create Db
//    use myCalibreDb
// create collection
//    db.createCollection("users")
// export with intellij (Option JSON-groovy.json)
// import : mongoimport -v --host localhost:27017 -d myCalibreDb -c users --jsonArray main_user.json


class DbMyCalibre {

  public static MY_CALIBRE_DIR = process.env.PATH_CACHE || path.resolve(`${__dirname}/../../data/my-calibre`);
  private static MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
  private static MONGO_DB_NMAE = 'myCalibreDb';


  private static _instance: DbMyCalibre = new DbMyCalibre();

  private _mongoDb;

  constructor() {

    DbMyCalibre._instance = this;

    // Connect to MongoDb
    MongoClient.connect(DbMyCalibre.MONGO_URL, {useUnifiedTopology: true}, function (err, mongoClient) {
      // There is no error
      if (err) {
        throw(err);
      }
      debug("Connected correctly to mongo server");

      DbMyCalibre._instance._mongoDb = mongoClient.db(DbMyCalibre.MONGO_DB_NMAE);


    });
  }

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
   * get last updated user Date
   * @returns {Promise<Date>}
   */
  public static findUserLastUpdate(): Promise<Date> {

    return new Promise<Date>((resolve, reject) => {
      DbMyCalibre.getAllUsers()
        .then(users => {
          if (users && (users.length > 0)) {
            resolve(users[0].updated);
          } else {
            reject("Not found");
          }
        })
        .catch(error => {
          reject(error);
        })

    })
  }

  /**
   * get a user from Db
   * @param id
   * @returns {Promise<User>}
   */
  public static findUserById(id: string): Promise<User> {
    return DbMyCalibre._findUserBy({id: id});
  }

  /**
   * get a user from Db
   * @param username
   * @returns {Promise<User>}
   */
  public static findUserByUsername(username: string): Promise<User> {
    return DbMyCalibre._findUserBy({ $or: [ { "local.username": username }, { local_username: username } ] });
  }

  /**
   * get a user from Db
   * @param facebookId
   * @returns {Promise<User>}
   */
  public static findByFacebookId(facebookId: string): Promise<User> {
    return DbMyCalibre._findUserBy({ $or: [ { "facebook.id": facebookId }, { facebook_id: facebookId } ] });
  }

  /**
   * get a user from Db
   * @param googleId
   * @returns {Promise<User>}
   */
  public static findByGoogleId(googleId: string): Promise<User> {
    return DbMyCalibre._findUserBy({ $or: [ { "google.id": googleId }, { google_id: googleId } ] });
  }

  /**
   * get a user from Db
   * @returns {Promise<User[]>}
   * @private
   */
  public static getAllUsers(): Promise<User[]> {

    return new Promise<User[]>((resolve, reject) => {

      if (DbMyCalibre._instance && DbMyCalibre._instance._mongoDb) {
        DbMyCalibre._instance._mongoDb.collection('users').find({}).sort({'updated': -1}).toArray((err, rows) => {
          if (err) {
            reject(err);
          } else {
            const users = rows.map(r => {
              let options = {};
              _.forEach(r, (value, key) => {
                _.set(options, key, value);
              });

              let user = new User(options);
              if (user.history && user.history.downloadedBooks) {
                _.forEach(user.history.downloadedBooks, d => {
                  if (typeof d.date === "string") {
                    d.date = new Date(d.date);
                  }
                })
              }
              if (user.history && user.history.ratings) {
                _.forEach(user.history.ratings, r => {
                  if (typeof r.date === "string") {
                    r.date = new Date(r.date);
                  }
                })
              }

              //debug(options['history']);
              return user
            });
            //debug(users);
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
   * @param {Object} query
   * @returns {Promise<User>}
   * @private
   */
  private static _findUserBy(query: Object): Promise<User> {

    return new Promise<User>((resolve, reject) => {

      if (DbMyCalibre._instance && DbMyCalibre._instance._mongoDb) {
        DbMyCalibre._instance._mongoDb.collection('users').findOne(query, (err, row) => {
          if (err) {
            reject(err);
          } else {
            if (row) {

              let user = new User(row);
              if (user.history && user.history.downloadedBooks) {
                _.forEach(user.history.downloadedBooks, d => {
                  if (typeof d.date === "string") {
                    d.date = new Date(d.date);
                  }
                })
              }
              if (user.history && user.history.ratings) {
                _.forEach(user.history.ratings, r => {
                  if (typeof r.date === "string") {
                    r.date = new Date(r.date);
                  }
                })
              }
              //debug(user);
              resolve(user);
            } else {
              resolve(null);
            }
          }
        })
      } else {
        setTimeout(() => {
          // wait a second and retry
          DbMyCalibre._findUserBy(query)
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
            debug("user deleted " + user.local.username + " " + user.local.firstname + " " + user.local.lastname + " (" + result + ")");

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
  public static saveUser(user: User, tryInsert: boolean, changeUpdateDate = true): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._updateUser(user, resolve, reject, tryInsert, changeUpdateDate);
    })
  }

  private static _updateUser(user: User, resolve, reject, tryInsert: boolean, changeUpdateDate = true) {
    let filter = {};
    filter['id'] = user.id;

    if (!user.created) {
      user.created = new Date();
    }
    if (changeUpdateDate) {
      user.updated = new Date();
    }

    // translate date that where previously in string type
    if (user.history && user.history.downloadedBooks) {
      _.forEach(user.history.downloadedBooks, d => {
        if (typeof d.date === "string") {
          d.date = new Date(d.date);
        }
      })
    }
    if (user.history && user.history.ratings) {
      _.forEach(user.history.ratings, d => {
        if (typeof d.date === "string") {
          d.date = new Date(d.date);
        }
      })
    }

    //debug(user.history);
    delete user['_id'];
    //debug(user);

    if (DbMyCalibre._instance && DbMyCalibre._instance._mongoDb) {
      // DbMyCalibre._instance._mongoDb.collection('users').updateOne(filter, {$set: user}, {upsert: tryInsert}, (err, result) => {
      DbMyCalibre._instance._mongoDb.collection('users').replaceOne(filter, user, {upsert: tryInsert}, (err) => {
        if (err) {
          debug(err);
          reject(err);
        } else {
          // debug("user updated " + user.local.username + " " + user.local.firstname + " " + user.local.lastname + " (" + result + ")");

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


}

export default DbMyCalibre
