import { Book, BookPath } from "./book";
import { Configuration } from "./configuration";
import DbCalibre from "./dbCalibre";
var debug = require('debug')('server:dbCalibre');

var fs = require('fs');
var path = require('path');

var sqlite3 = require("sqlite3").verbose();
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

  public getConf(): Promise<Configuration> {

    return new Promise<Configuration>((resolve, reject) => {

      var query = squel
          .select({separator: "\n"})

          // bookFields
          .field('config.smtp_user_name', 'smtp_user_name')
          .field('config.smtp_password', 'smtp_password')
          .field('config.smtp_server_name', 'smtp_server_name')
          .field('config.smtp_port', 'smtp_port')
          .field('config.smtp_encryption', 'smtp_encryption')

          .from('config')
        ;

      this._db.get(query.toString(), (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(new Configuration(row));
        }
      })
    })

  }


}

export default DbMyCalibre
