import { Configuration } from "./configuration";
import { User } from "./user";
import DbCalibre from "./dbCalibre";
const debug = require('debug')('server:dbCalibre');

const fs = require('fs');
const path = require('path');

const sqlite3 = require("sqlite3").verbose();
const squel = require("squel");

class DbMyCalibre {

  public static MYCALIBRE_DIR = path.resolve(`${__dirname}/../../data/my-calibre`);
  private static DB_FILE = `${DbMyCalibre.MYCALIBRE_DIR}/my-calibre.db`;

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
   * @returns {Promise<any>}
   */
  public getConfAsRow(): Promise<any> {

    return new Promise<Configuration>((resolve, reject) => {

      const query = squel
        .select({separator: "\n"})

        // bookFields
        .field('config.smtp_user_name', 'smtp_user_name')
        .field('config.smtp_password', 'smtp_password')
        .field('config.smtp_server_name', 'smtp_server_name')
        .field('config.smtp_port', 'smtp_port')
        .field('config.smtp_encryption', 'smtp_encryption')
        .field('config.jwt_secret', 'jwt_secret')
        .field('config.hashedPasswordLength', 'hashedPasswordLength')
        .field('config.hashedPasswordDigest', 'hashedPasswordDigest')

        .from('config');

      this._db.get(query.toString(), (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      })
    })

  }

  /**
   * get all user from Db
   * @returns {Promise<User>}
   */
  public getUsers(limit?: number, offset?: number): Promise<User[]> {
    limit = limit || 1000000;
    offset = offset || 0;

    return new Promise<User[]>((resolve, reject) => {

      const query = squel
        .select({separator: "\n"})

        // userFields
        .field('user.username', 'username')
        .field('user.firstname', 'firstname')
        .field('user.lastname', 'lastname')
        .field('user.email', 'email')
        .field('user.hashedPassword', 'hashedPassword')
        .field('user.salt', 'salt')
        .field('user.isAdmin', 'isAdmin')
        .field('user.created', 'created')
        .field('user.updated', 'updated')

        .from('user')
        .limit(limit)
        .offset(offset);

      this._db.all(query.toString(), (err, row) => {
        if (err) {
          reject(err);
        } else {
          const users = row.map(u => {
            return new User(u)
          });
          resolve(users);
        }
      })
    })

  }

  /**
   * get a user (by username)
   * @param username
   * @returns {Promise<User>}
   */
  public getUser(username: string): Promise<User> {

    return new Promise<User>((resolve, reject) => {

      const query = squel
        .select({ separator: "\n" })

        // userFields
        .field('user.username', 'username')
        .field('user.firstname', 'firstname')
        .field('user.lastname', 'lastname')
        .field('user.email', 'email')
        .field('user.hashedPassword', 'hashedPassword')
        .field('user.salt', 'salt')
        .field('user.isAdmin', 'isAdmin')
        .field('user.created', 'created')
        .field('user.updated', 'updated')

        .from('user')
        .where('user.username = ?', username);

      //debug(query.toString());

      this._db.get(query.toString(), (err, row) => {
        if (err) {
          reject(err);
        } else {
          //debug(row);
          resolve(new User(row));
        }
      })
    })
  }


  private static _makeWhere(tableName: string, locator?: string, columnName?: string, sep?: string): any {

    columnName = columnName || 'name';
    sep = sep || '.';

    const getAll = (locator == null || locator == '*' || locator == '' || locator == '/');
    const isNumber = /\d+/.test(locator + '');
    const isString = !isNumber;
    const whereStatement = getAll ?
        `${tableName}${sep}id LIKE ?` :
        isString ?
          `${tableName}${sep}${columnName} COLLATE UTF8_GENERAL_CI LIKE ?` :
          `${tableName}${sep}id = ?`
      ;
    const value = getAll ? '%' : isString ? `%${locator}%` : locator;
    return [whereStatement, value];

  }

}

export default DbMyCalibre
