import { Book, BookPath } from "./book";
const debug = require('debug')('server:dbCalibre');

const fs = require('fs');
const path = require('path');

const sqlite3 = require("sqlite3").verbose();
const squel = require("squel");

class DbCalibre {

  public static CALIBRE_DIR = path.resolve(`${__dirname}/../../data/calibre`);
  private static DB_FILE = `${DbCalibre.CALIBRE_DIR}/metadata.db`;

  private static _instance: DbCalibre = new DbCalibre();

  private _db;
  private _dbDate: Date;

  constructor() {

    debug("Opening '"+DbCalibre.DB_FILE+"'");

    try {
      this._db = new sqlite3.Database(DbCalibre.DB_FILE)
      this.getDbDate().then(date => {
        this._dbDate = date;
        debug("New Db : "+date);
      })
    } catch (error) {
      throw(error);
    }
    if (DbCalibre._instance) {
      throw new Error("Error: Instantiation failed: Use DbCalibre.getInstance() instead of new.");
    }
    DbCalibre._instance = this;
  }

  public static getInstance(): DbCalibre {
    return DbCalibre._instance;
  }

  public getDbDate(): Promise<Date> {
    const _that = this;
    return new Promise<Date>((resolve, reject) => {
      fs.stat(DbCalibre.DB_FILE, function (err, stats) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          // if date change, change Db instance
          if (_that._dbDate && (stats.mtime.getTime() != _that._dbDate.getTime())) {
            DbCalibre._instance = null;
            DbCalibre._instance = new DbCalibre();

            resolve(stats.mtime);
          } else {
            resolve(stats.mtime);
          }
        }
      });

    });
  }

  public getBooks(limit?: number, offset?: number): Promise<Book[]> {
    limit = limit || 1000000;
    offset = offset || 0;

    return new Promise<Book[]>((resolve, reject) => {

      const whereValue = DbCalibre._makeWhere('book', "", 'title', '_');
      const where = whereValue[0];
      const value = whereValue[1];

      const query = squel
        .select({ separator: "\n" })

        // bookFields
        .field('books.id', 'book_id')
        .field('books.title', 'book_title')
        .field('books.sort', 'book_sort')
        .field('books.author_sort', 'author_sort')
        .field('books.has_cover', 'book_has_cover')
        .field('books.pubdate', 'book_date')
        .field('books.path', 'book_path')
        .field('books.isbn', 'book_isbn')
        .field('books.series_index', 'book_series_index')
        .field('books.timestamp', 'timestamp')
        .field('books.last_modified', 'last_modified')

        // sumAuthor
        .field(DbCalibre._concat('author', 'book', 'id'), 'author_id')
        .field(DbCalibre._concat('author', 'book', 'name'), 'author_name')
        .field(DbCalibre._concat('author', 'book', 'sort'), 'author_sort')

        // sumTags
        .field(DbCalibre._concat('tag', 'book', 'id'), 'tag_id')
        .field(DbCalibre._concat('tag', 'book', 'name'), 'tag_name')

        // sunSeries
        .field(DbCalibre._concat('series', 'book', 'id'), 'series_id')
        .field(DbCalibre._concat('series', 'book', 'name'), 'series_name')
        .field(DbCalibre._concat('series', 'book', 'sort'), 'series_sort')

        // sumData
        .field(DbCalibre._concat_simple('data', 'books', 'book', 'id'), 'data_id')
        .field(DbCalibre._concat_simple('data', 'books', 'book', 'format'), 'data_format')
        .field(DbCalibre._concat_simple('data', 'books', 'book', 'uncompressed_size'), 'data_size')
        .field(DbCalibre._concat_simple('data', 'books', 'book', 'name', false), 'data_name')

        // appendComments
        .left_join('comments', null, 'comments.book = books.id')

        // commentTags
        .field('comments.text', 'comment')

        .from('books')
        .group('book_title')
        .where(where, value)
        .order("timestamp", false)
        .limit(limit)
        .offset(offset);

      //debug(query.toString());

      this._db.all(query.toString(), (err, row) => {
        if (err) {
          reject(err);
        } else {
          const books = row.map(b => {
            return new Book(b)
          });
          resolve(books);
        }
      })
    })

  }

  public getBookPaths(id: number): Promise<BookPath> {

    return new Promise<BookPath>((resolve, reject) => {

      const whereValue = DbCalibre._makeWhere('book', ""+id, 'title', '_');
      //debug(whereValue);
      const where = whereValue[0];
      const value = whereValue[1];

      const query = squel
        .select({ separator: "\n" })

        // bookFields
        .field('books.id', 'book_id')
        .field('books.has_cover', 'book_has_cover')
        .field('books.path', 'book_path')

        // sumData
        .field(DbCalibre._concat_simple('data', 'books', 'book', 'id'), 'data_id')
        .field(DbCalibre._concat_simple('data', 'books', 'book', 'format'), 'data_format')
        .field(DbCalibre._concat_simple('data', 'books', 'book', 'uncompressed_size'), 'data_size')
        .field(DbCalibre._concat_simple('data', 'books', 'book', 'name', false), 'data_name')

        .from('books')
        //.group('book_title')
        .where(where, value);

      //debug(query.toString());

      this._db.get(query.toString(), (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(new BookPath(row));
        }
      })
    })
  }

  public static _makeWhere(tableName: string, locator?: string, columnName?: string, sep?: string): any {

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

  private static _concat(f1, f2, prop, dir?: boolean, sep?: string): string {
    dir = dir || false;
    sep = sep || '|';

    const t1 = f1.replace(/s$/, '') + 's';
    const t2 = f2.replace(/s$/, '') + 's';
    const link = (dir ? `${t1}_${t2}` : `${t2}_${t1}`) + '_link';
    const fields = [f1, f2];
    return DbCalibre.__concat(t1, t2, link, prop, fields, sep);
  }

  private static _concat_simple(t, t2, f, prop, distinct?): string {
    distinct = (distinct == null) ? true : distinct;

    const distinctS = distinct ? ' DISTINCT' : '';
    const c = `${t}_${f}`;
    return `(SELECT GROUP_CONCAT(${c}, '|') FROM (SELECT${distinctS} ${t}.${prop} ${c} FROM ${t} WHERE ${t}.${f} = ${t2}.id))`;
  }

  private static __concat(t1, t2, link, prop, fields, sep?: string): string {
    sep = sep || '|';

    const f1 = fields[0];
    const f2 = fields[1];
    const c = `${t1}_${prop}`;
    return `(SELECT GROUP_CONCAT(${c}, '${sep}') FROM (SELECT DISTINCT ${t1}.${prop} ${c} FROM ${link} JOIN ${t1} ON ${link}.${f1} = ${t1}.id WHERE ${link}.${f2} = ${t2}.id))`;
  }


  /**
   * Split an attribute separate by pipe to an array
   * @param row
   * @param name
   */
  public static splitAttribute(row, name) {
  if (row[name]) {
    //console.log(row[name]+" -> "+row[name].split('|'))
    row[name] = row[name].split('|');
  } else {
    row[name] = [];
  }
}
}

export default DbCalibre
