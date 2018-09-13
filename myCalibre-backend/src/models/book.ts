import * as _ from "lodash";
import DbCalibre from "./dbCalibre";
import DbMyCalibre from "./dbMyCalibre";

const path = require('path');
const debug = require('debug')('server:models:book');

export class Book {

  book_id: number;
  book_title: string;
  book_sort: string;
  author_sort: string[];
  book_has_cover: string;
  book_path: string;
  book_series_index: number;
  author_id: number[];
  author_name: string[];
  tag_id: number[];
  tag_name: string[];
  rating_id: number;
  rating: string;
  lang_id: number;
  lang_code: string;
  series_id: string;
  series_name: string;
  series_sort: string;
  comment: string;
  book_date: Date;
  timestamp: Date;
  last_modified: Date;

  data: BookData[];

  history: {
    ratings: BookRating[],
    downloads: BookDownloaded[]
  };
  readerRating: number;
  readerRatingCount: number;

  constructor (options: {}) {
    _.merge(this, options);

    ['data_id', 'data_format', 'data_size', 'data_name', 'tag_id', 'tag_name', 'author_sort', 'author_id', 'author_name'].forEach(name => {
      DbCalibre.splitAttribute(this, name);
    });
    ['book_date', 'timestamp', 'last_modified'].forEach(name => {
      this[name] = new Date(this[name]);
    });

    BookPath.createBookData(this);

    if (!this.history) {
      this.history = {
        ratings: [],
        downloads: []
      }
    }
    if (!this.history.ratings) {
      this.history.ratings = []
    }
    if (!this.history.downloads) {
      this.history.downloads = []
    }

  }

  getCoverPath () {
    return path.resolve(`${DbCalibre.CALIBRE_DIR}/${this.book_path}/cover.jpg`);
  }

  getThumbnailPath () {
    return path.resolve(`${DbMyCalibre.MY_CALIBRE_DIR}/thumbnail/${this.book_path}/thumbnail.jpg`);
  }

  /**
   * Add to book object the user things (downloaded, rating, ...)
   * @param {Object[]} rows
   * @returns {Promise<Object>}
   */
  static updateBooksFromRows (rows: Object[]): Promise<Object> {
    return new Promise((resolve, reject) => {

      DbMyCalibre.getAllUsers()
                 .then(users => {

                   // Get lists of all downloaded books/ all ratings
                   let downloadedBooksById: { [id: string]: BookDownloaded[]; } = {};
                   let ratingsById: { [id: string]: BookRating[]; } = {};
                   for (let i = 0; i < users.length; i++) {
                     let user = users[i];
                     for (let j = 0; j < user.history.downloadedBooks.length; j++) {
                       let b = user.history.downloadedBooks[j];
                       if (!downloadedBooksById[b.id]) {
                         downloadedBooksById[b.id] = [];
                       }
                       downloadedBooksById[b.id].push({
                         date: b.date,
                         user_id: user.id,
                         user_name: ((user.local && (user.local.firstname || user.local.lastname)) ? user.local.firstname + ' ' + user.local.lastname : user.local.username)
                       });
                     }
                     for (let j = 0; j < user.history.ratings.length; j++) {
                       let b = user.history.ratings[j];
                       if (!ratingsById[b.book_id]) {
                         ratingsById[b.book_id] = [];
                       }
                       ratingsById[b.book_id].push({
                         rating: b.rating,
                         date: b.date,
                         user_id: user.id,
                         user_name: ((user.local && (user.local.firstname || user.local.lastname)) ? user.local.firstname + ' ' + user.local.lastname : user.local.username)
                       });
                     }
                   }

                   // Upfdate each books from these data
                   let lastUpdated = new Date(0);
                   if ((rows.length > 0) && rows[0]['books']) {
                     for (let i = 0; i < rows.length; i++) {
                       let lastUpdatedTmp = Book.updateBooksFromUsers(rows[i]['books'] as Book[], downloadedBooksById, ratingsById);
                       if (lastUpdated.getTime() < lastUpdatedTmp.getTime()) {
                         lastUpdated = lastUpdatedTmp;
                       }
                     }
                   } else {
                     lastUpdated = Book.updateBooksFromUsers(rows as Book[], downloadedBooksById, ratingsById);
                   }

                   debug(lastUpdated);
                   resolve({
                     lastUpdated: lastUpdated,
                     data: rows
                   })

                 })
                 .catch(err => {
                   reject(err);
                 })

    });
  }

  static updateBooksFromUsers (books: Book[], downloadedBooksById: { [id: string]: BookDownloaded[]; }, ratingsById: { [id: string]: BookRating[]; }) {
    let lastUpdated = new Date(0);

    for (let i = 0; i < books.length; i++) {
      let book = books[i];
      if (downloadedBooksById[book.book_id]) {
        for (let j = 0; j < downloadedBooksById[book.book_id].length; j++) {
          book.history.downloads.push(downloadedBooksById[book.book_id][j]);
          if (book.last_modified.getTime() < downloadedBooksById[book.book_id][j].date.getTime()) {
            book.last_modified = downloadedBooksById[book.book_id][j].date;
            //debug(`Change 1 ${book.book_id}`);
          }
        }
      }
      if (ratingsById[book.book_id]) {
        let sum = 0;
        book.readerRatingCount = 0;
        for (let j = 0; j < ratingsById[book.book_id].length; j++) {
          book.readerRatingCount++;
          sum += ratingsById[book.book_id][j].rating;
          book.history.ratings.push(ratingsById[book.book_id][j]);
          if (book.last_modified.getTime() < ratingsById[book.book_id][j].date.getTime()) {
            book.last_modified = ratingsById[book.book_id][j].date;
            //debug(`Change 2 ${book.book_id}`);
          }
        }
        book.readerRating = sum / Math.max(book.readerRatingCount, 1);
      }

      if (lastUpdated.getTime() < book.last_modified.getTime()) {
        lastUpdated = book.last_modified;
      }
    }

    return lastUpdated;
  }

}

export class BookPath {

  book_id: number;
  book_has_cover: string;
  book_path: string;

  data: BookData[];

  constructor (options: {}) {
    _.merge(this, options);

    ['data_id', 'data_format', 'data_size', 'data_name'].forEach(name => {
      DbCalibre.splitAttribute(this, name);
    });

    BookPath.createBookData(this);

  }

  getCoverPath () {
    return path.resolve(`${DbCalibre.CALIBRE_DIR}/${this.book_path}/cover.jpg`);
  }

  getThumbnailPath () {
    return path.resolve(`${DbMyCalibre.MY_CALIBRE_DIR}/thumbnail/${this.book_path}/thumbnail.jpg`);
  }

  /**
   * Create new abject and delete unused attribute
   * @param book
   */
  static createBookData (book: BookPath | Book) {
    book.data = [];
    book['data_id'].forEach((id, index) => {
      book.data.push(new BookData({
        data_id: id,
        data_format: book['data_format'][index],
        data_size: book['data_size'][index],
        data_name: book['data_name'][index],
      }))
    });

    delete book['data_id'];
    delete book['data_format'];
    delete book['data_size'];
    delete book['data_name'];
  }
}

export class BookData {
  data_id: number;
  data_format: string;
  data_size: number;
  data_name: string;

  constructor (options: {}) {
    _.merge(this, options);
  }
}

export class BookRating {
  rating: number;
  date: Date;
  // noinspection JSUnusedGlobalSymbols
  user_id: string;
  // noinspection JSUnusedGlobalSymbols
  user_name: string;

  constructor (options: {}) {
    _.merge(this, options);
  }
}

export class BookDownloaded {
  date: Date;
  // noinspection JSUnusedGlobalSymbols
  user_id: string;
  // noinspection JSUnusedGlobalSymbols
  user_name: string;

  constructor (options: {}) {
    _.merge(this, options);
  }
}