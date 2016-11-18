var debug = require('debug')('server:test');

var fs = require('fs');
var sqlite3 = require("sqlite3").verbose();
const squel = require("squel");

const DB_FILE = './data/metadata.db';

class DbCalibre {

  private static _instance: DbCalibre = new DbCalibre();

  private _db = new sqlite3.Database(DB_FILE);

  constructor() {
    if (DbCalibre._instance) {
      throw new Error("Error: Instantiation failed: Use DbCalibre.getInstance() instead of new.");
    }
    DbCalibre._instance = this;

    fs.stat(DB_FILE, function (err, stats) {
      if (err) {
        console.log(err);
      } else {
        console.log('stats: ' + JSON.stringify(stats));
        debug(stats);
      }
    });
  }

  public static getInstance(): DbCalibre {
    return DbCalibre._instance;
  }

  test() {
    debug(DbCalibre._makeWhere('book'));
    debug(DbCalibre._makeWhere('book', "sdfsf", 'title', '_'));
    debug(DbCalibre._makeWhere('book', "2"));


    this._db.all("select * from books order by sort limit 10", (err, row) => {
      debug({err, row});
    })

    debug(this._db);
    debug('======');

  }

  public getBooks(limit: number, offset: number): Promise<any[]> {

    return new Promise<any[]>((resolve, reject) => {

      const whereValue = DbCalibre._makeWhere('book', "", 'title', '_');
      const where = whereValue[0];
      const value = whereValue[1];

      var query = squel
          .select({separator: "\n"})

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
          .limit(limit)
          .offset(offset)
        ;

      debug(query.toString());

      this._db.all(query.toString(), (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
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


}

export default DbCalibre
