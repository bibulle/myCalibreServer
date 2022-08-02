import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Database } from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { Book, BookPath, User, Series, Author, Tag, CacheContent, Downloader, ReaderRating } from "@my-calibre-server/api-interfaces";
import { BooksService } from "../books/books.service";
import * as queryBuilder from '@rechat/squel';



@Injectable()
export class CalibreDb1Service {
  private readonly logger = new Logger(CalibreDb1Service.name);

  public static CALIBRE_DIR: string;
  private static DB_FILE: string;

  private _db: Database;
  private _dbDate: Date;

  constructor(private readonly _configService: ConfigService) {
    CalibreDb1Service.CALIBRE_DIR = this._configService.get('PATH_BOOKS') || path.resolve(`${__dirname}/../../../data/calibre`);
    CalibreDb1Service.DB_FILE = `${CalibreDb1Service.CALIBRE_DIR}/metadata.db`;

    this._getDb();
    this.getDbDate();
    this.logger.debug(`Opening '${CalibreDb1Service.DB_FILE}'`);

    this._getDb();
    this.getDbDate()
      .then((date: Date) => {
        this._dbDate = date;
        this.logger.debug('New CalibreDb : ' + date);
      })
      .catch((reason) => {
        this.logger.error(reason);
        this.logger.error(`Cannot open calibre Db : '${CalibreDb1Service.DB_FILE}'`);
      });

  }

  private _getDb(): Database {
    if (!this._db) {
      this._db = new Database(CalibreDb1Service.DB_FILE);
    }
    return this._db;
  }

  public getDbDate(): Promise<Date> {
    return new Promise<Date>((resolve, reject) => {
      fs.stat(CalibreDb1Service.DB_FILE, (err, stats) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          // if date change, change Db instance
          if (this._dbDate && stats.mtime.getTime() != this._dbDate.getTime()) {
            this._db = null;
            this._db = this._getDb();

            resolve(stats.mtime);
          } else {
            resolve(stats.mtime);
          }
        }
      });
    });
  }

  public getBooks(limit?: number, offset?: number, id?: number): Promise<Book[]> {
    limit = limit || 1000000;
    offset = offset || 0;
    const locator: string = id ? '' + id : '';

    return new Promise<Book[]>((resolve, reject) => {
      const whereValue = this._makeWhere('book', locator, 'title', '_');
      const where = whereValue[0];
      const value = whereValue[1];

      const query = queryBuilder
        .select({ separator: '\n' })

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
        .field(this._concat('author', 'book', 'id'), 'author_id')
        .field(this._concat('author', 'book', 'name'), 'author_name')
        .field(this._concat('author', 'book', 'sort'), 'author_sort')

        // sumLanguage
        .field(this.__concat('languages', 'books', 'books_languages_link', 'id', ['lang_code', 'book'], '|'), 'lang_id')
        .field(this.__concat('languages', 'books', 'books_languages_link', 'lang_code', ['lang_code', 'book'], '|'), 'lang_code')

        // sumTags
        .field(this._concat('tag', 'book', 'id'), 'tag_id')
        .field(this._concat('tag', 'book', 'name'), 'tag_name')

        // sumRating
        .field(this._concat('rating', 'book', 'id'), 'rating_id')
        .field(this._concat('rating', 'book', 'rating'), 'rating')

        // sunSeries
        .field(this._concat('series', 'book', 'id'), 'series_id')
        .field(this._concat('series', 'book', 'name'), 'series_name')
        .field(this._concat('series', 'book', 'sort'), 'series_sort')

        // sumData
        .field(this._concat_simple('data', 'books', 'book', 'id'), 'data_id')
        .field(this._concat_simple('data', 'books', 'book', 'format'), 'data_format')
        .field(this._concat_simple('data', 'books', 'book', 'uncompressed_size'), 'data_size')
        .field(this._concat_simple('data', 'books', 'book', 'name', false), 'data_name')

        // appendComments
        .left_join('comments', null, 'comments.book = books.id')

        // commentTags
        .field('comments.text', 'comment')

        .from('books')
        //.group('book_title')
        .where(where, value)
        .order('timestamp', false)
        .limit(limit)
        .offset(offset);

      // this.logger.debug(query.toString());

      this._db.all(query.toString(), (err, row) => {
        if (err) {
          reject(err);
        } else {
          const books = row.map((b) => {
            //this.logger.debug(b);
            return BooksService.createBook(b);
          });
          resolve(books);
        }
      });
    });
  }
  public getBooksCount(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      const query = queryBuilder
        .select({ separator: '\n' })

        // bookFields
        .field('count(books.id)', 'count')
        .from('books');

      // this.logger.debug(query.toString());

      this._db.all(query.toString(), (err, row) => {
        if (err) {
          reject(err);
        } else {
          const books: number[] = row.map((b) => {
            // this.logger.debug(b);
            return b.count;
          });
          resolve(books[0]);
        }
      });
    });
  }

  public getBookPaths(id: number): Promise<BookPath> {
    return new Promise<BookPath>((resolve, reject) => {
      const whereValue = this._makeWhere('book', '' + id, 'title', '_');
      //debug(whereValue);
      const where = whereValue[0];
      const value = whereValue[1];

      const query = queryBuilder
        .select({ separator: '\n' })

        // bookFields
        .field('books.id', 'book_id')
        .field('books.has_cover', 'book_has_cover')
        .field('books.path', 'book_path')

        // sumData
        .field(this._concat_simple('data', 'books', 'book', 'id'), 'data_id')
        .field(this._concat_simple('data', 'books', 'book', 'format'), 'data_format')
        .field(this._concat_simple('data', 'books', 'book', 'uncompressed_size'), 'data_size')
        .field(this._concat_simple('data', 'books', 'book', 'name', false), 'data_name')

        .from('books')
        //.group('book_title')
        .where(where, value);

      //debug(query.toString());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._db.get(query.toString(), (err: any, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(BooksService.createBook(row));
        }
      });
    });
  }

  public getBook(id: number, users: Promise<User[]>): Promise<Book> {
    return new Promise<Book>((resolve, reject) => {
      this.getBooks(1, 0, id)
        .then((books) => {
          if (books && books.length >= 1) {
            this.fillBooksFromUser(books, users, false)
              .then((books) => {
                resolve(books[0] as Book);
              })
              .catch((reason) => {
                reject(reason);
              });
            resolve(books[0]);
          } else {
            reject('Not found');
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public getAllSeries(): Promise<Series[]> {
    return new Promise((resolve, reject) => {
      this.getBooks(1000000, 0)
        .then((books: Book[]) => {
          const series: Series[] = [];
          const seriesHash: { [id: string]: Series } = {};

          books.forEach((book) => {
            if (book.series_id) {
              if (!seriesHash[book.series_id]) {
                seriesHash[book.series_id] = {
                  series_id: +book.series_id,
                  series_name: book.series_name,
                  series_sort: book.series_sort,
                  books: [],
                  author_name: [],
                  author_sort: [],
                  book_date: [],
                };
                series.push(seriesHash[book.series_id]);
              }

              seriesHash[book.series_id].books.push(book);
              seriesHash[book.series_id].books.sort((b1, b2) => {
                return b1.book_series_index - b2.book_series_index;
              });
            }
          });

          // fill series with books info
          series.forEach((s: Series) => {
            s.books.forEach((b: Book) => {
              if (b.book_date.getFullYear() > 1000) {
                s.book_date.push(b.book_date);
              }
              s.author_name = s.author_name.concat(b.author_name);
              s.author_sort = s.author_sort.concat(b.author_sort);
            });

            s.book_date = s.book_date
              .reduce((result: Date[], current: Date) => {
                if (
                  result.filter((d) => {
                    return d.getFullYear() == current.getFullYear();
                  }).length == 0
                ) {
                  result.push(current);
                }
                return result;
              }, [])
              .sort();
            s.author_name = s.author_name
              .reduce((result, current) => {
                if (
                  result.filter((d) => {
                    return d == current;
                  }).length == 0
                ) {
                  result.push(current);
                }
                return result;
              }, [])
              .sort();
            s.author_sort = s.author_sort
              .reduce((result, current) => {
                if (
                  result.filter((d) => {
                    return d == current;
                  }).length == 0
                ) {
                  result.push(current);
                }
                return result;
              }, [])
              .sort();
          });

          //debug("done");
          resolve(series);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public getAllAuthors(): Promise<Author[]> {
    return new Promise((resolve, reject) => {
      this.getBooks(1000000, 0)
        .then((books: Book[]) => {
          const authors: Author[] = [];
          const authorsHash: { [id: string]: Author } = {};

          books.forEach((book) => {
            book.author_id.forEach((author_id, index) => {
              if (!authorsHash[author_id]) {
                authorsHash[author_id] = {
                  author_id: +author_id,
                  author_name: book.author_name[index],
                  author_sort: book.author_sort[index],
                  books: [],
                  book_date: [],
                };
                authors.push(authorsHash[author_id]);
              }

              authorsHash[author_id].books.push(book);
            });
          });

          // fill series with books info
          authors.forEach((a: Author) => {
            a.books.forEach((b: Book) => {
              if (b.book_date.getFullYear() > 1000) {
                a.book_date.push(b.book_date);
              }
            });

            a.book_date = a.book_date
              .reduce((result: Date[], current: Date) => {
                if (
                  result.filter((d) => {
                    return d.getFullYear() == current.getFullYear();
                  }).length == 0
                ) {
                  result.push(current);
                }
                return result;
              }, [])
              .sort();

            a.books.sort((b1, b2) => {
              const v1 = (b1.series_sort == null ? '' : b1.series_sort + ' ') + (b1.series_name == null ? '' : (b1.book_series_index + '').padStart(6, '0') + ' ') + b1.book_sort;
              const v2 = (b2.series_sort == null ? '' : b2.series_sort + ' ') + (b2.series_name == null ? '' : (b2.book_series_index + '').padStart(6, '0') + ' ') + b2.book_sort;
              return v1.localeCompare(v2);
            });
          });

          //debug("done");
          resolve(authors);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public getAllTags(): Promise<Tag[]> {
    return new Promise((resolve, reject) => {
      this.getBooks(1000000, 0)
        .then((books: Book[]) => {
          const tags: Tag[] = [];
          const tagsHash: { [id: string]: Tag } = {};

          books.forEach((book) => {
            book.tag_id.forEach((tag_id, index) => {
              if (!tagsHash[tag_id]) {
                tagsHash[tag_id] = {
                  tag_id: +tag_id,
                  tag_name: book.tag_name[index],
                  books: [],
                };
                tags.push(tagsHash[tag_id]);
              }

              tagsHash[tag_id].books.push(book);
            });
          });

          // fill series with books info
          tags.forEach((t: Tag) => {
            t.books.sort((b1, b2) => {
              const v1 = (b1.series_sort == null ? '' : b1.series_sort + ' ') + (b1.series_name == null ? '' : (b1.book_series_index + '').padStart(6, '0') + ' ') + b1.book_sort;
              const v2 = (b2.series_sort == null ? '' : b2.series_sort + ' ') + (b2.series_name == null ? '' : (b2.book_series_index + '').padStart(6, '0') + ' ') + b2.book_sort;
              return v1.localeCompare(v2);
            });
          });

          //debug("done");
          resolve(tags);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * Add to book object the user things (downloaded, rating, ...)
   * @param books
   * @param users
   * @returns
   */
  fillBooksFromUser(objects: CacheContent[], users: Promise<User[]>, cleanBook: boolean): Promise<CacheContent[]> {
    return new Promise((resolve, reject) => {
      //this.logger.debug(JSON.stringify(books));
      users
        .then((users) => {
          // Get lists of all downloaded books/ all ratings
          const downloadedBooksById: { [id: string]: Downloader[] } = {};
          const ratingsById: { [id: string]: ReaderRating[] } = {};

          users.forEach((user) => {
            if (user.history.downloadedBooks) {
              user.history.downloadedBooks.forEach((book) => {
                if (!downloadedBooksById[book.id]) {
                  downloadedBooksById[book.id] = [];
                }
                downloadedBooksById[book.id].push({
                  date: book.date,
                  user_id: user.id,
                  user_name: user.local && (user.local.firstname || user.local.lastname) ? user.local.firstname + ' ' + user.local.lastname : user.local.username,
                  data_format: book.data.data_format,
                });
              });
            }
            if (user.history.ratings) {
              user.history.ratings.forEach((rating) => {
                if (!ratingsById[rating.book_id]) {
                  ratingsById[rating.book_id] = [];
                }
                ratingsById[rating.book_id].push({
                  rating: rating.rating,
                  date: rating.date,
                  user_id: user.id,
                  user_name: user.local && (user.local.firstname || user.local.lastname) ? user.local.firstname + ' ' + user.local.lastname : user.local.username,
                });
              });
            }
          });

          let booList: Book[] = [];
          objects.forEach((o) => {
            if (o['book_id'] > 0) {
              booList.push(o as Book);
            } else {
              booList = booList.concat(o['books']);
            }
          });

          //Update each books from these data
          booList.forEach((book) => {
            if (downloadedBooksById[book.book_id]) {
              downloadedBooksById[book.book_id].forEach((downloader) => {
                book.history.downloads.push(downloader);
                if (book.last_modified.getTime() < downloader.date.getTime()) {
                  book.last_modified = downloader.date;
                }
              });
            }
            if (ratingsById[book.book_id]) {
              let sum = 0;
              book.readerRatingCount = 0;
              ratingsById[book.book_id].forEach((readerRating) => {
                book.readerRatingCount++;
                sum += readerRating.rating;
                book.history.ratings.push(readerRating);
                if (book.last_modified.getTime() < readerRating.date.getTime()) {
                  book.last_modified = readerRating.date;
                }
              });
              book.readerRating = sum / Math.max(book.readerRatingCount, 1);
            }

            // Suppress useless info in the list
            if (cleanBook) {
              delete book['book_path'];
              delete book['book_isbn'];
              delete book['timestamp'];
              delete book['tag_id'];
              delete book['tag_name'];
              delete book['comment'];
              delete book['data'];
              delete book['rating_id'];
            }
          });

          // debug(lastUpdated);
          resolve(objects);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public _makeWhere(tableName: string, locator?: string, columnName?: string, sep?: string): any {
    columnName = columnName || 'name';
    sep = sep || '.';

    const getAll = locator == null || locator == '*' || locator == '' || locator == '/';
    const isNumber = /\d+/.test(locator + '');
    const isString = !isNumber;
    const whereStatement = getAll ? `${tableName}${sep}id LIKE ?` : isString ? `${tableName}${sep}${columnName} COLLATE UTF8_GENERAL_CI LIKE ?` : `${tableName}${sep}id = ?`;
    const value = getAll ? '%' : isString ? `%${locator}%` : locator;
    return [whereStatement, value];
  }

  private _concat(f1, f2, prop, dir?: boolean, sep?: string): string {
    dir = dir || false;
    sep = sep || '|';

    const t1 = f1.replace(/s$/, '') + 's';
    const t2 = f2.replace(/s$/, '') + 's';
    const link = (dir ? `${t1}_${t2}` : `${t2}_${t1}`) + '_link';
    const fields = [f1, f2];
    return this.__concat(t1, t2, link, prop, fields, sep);
  }

  private _concat_simple(t, t2, f, prop, distinct?): string {
    distinct = distinct == null ? true : distinct;

    const distinctS = distinct ? ' DISTINCT' : '';
    const c = `${t}_${f}`;
    return `(SELECT GROUP_CONCAT(${c}, '|') FROM (SELECT${distinctS} ${t}.${prop} ${c} FROM ${t} WHERE ${t}.${f} = ${t2}.id))`;
  }

  private __concat(t1, t2, link, prop, fields, sep?: string): string {
    sep = sep || '|';

    const f1 = fields[0];
    const f2 = fields[1];
    const c = `${t1}_${prop}`;
    return `(SELECT GROUP_CONCAT(${c}, '${sep}') FROM (SELECT DISTINCT ${t1}.${prop} ${c} FROM ${link} JOIN ${t1} ON ${link}.${f1} = ${t1}.id WHERE ${link}.${f2} = ${t2}.id))`;
  }
}