import * as _ from "lodash";
import DbCalibre from "./dbCalibre";
import DbMyCalibre from "./dbMyCalibre";
const path = require('path');
// const debug = require('debug')('server:models:book');

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
  series_id: string;
  series_name: string;
  series_sort: string;
  comment: string;
  book_date: Date;

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

  getCoverPath() {
    return path.resolve(`${DbCalibre.CALIBRE_DIR}/${this.book_path}/cover.jpg`);
  }
  getThumbnailPath() {
    return path.resolve(`${DbMyCalibre.MY_CALIBRE_DIR}/thumbnail/${this.book_path}/thumbnail.jpg`);
  }


  static updateBooksFromUsers(books: Book[], downloadedBooksById: { [id: string] : BookDownloaded[]; }, ratingsById: { [id: string] : BookRating[]; }) {
    for (let i = 0; i < books.length; i++) {
      let book = books[i];
      if (downloadedBooksById[book.book_id]) {
        for (let j = 0; j < downloadedBooksById[book.book_id].length; j++) {
          book.history.downloads.push(downloadedBooksById[book.book_id][j]);
        }
      }
      if (ratingsById[book.book_id]) {
        let sum = 0;
        book.readerRatingCount = 0;
        for (let j = 0; j < ratingsById[book.book_id].length; j++) {
          book.readerRatingCount++;
          sum+=ratingsById[book.book_id][j].rating;
          book.history.ratings.push(ratingsById[book.book_id][j]);
        }
        book.readerRating = sum / Math.max(book.readerRatingCount, 1);
      }
    }
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

  getCoverPath() {
    return path.resolve(`${DbCalibre.CALIBRE_DIR}/${this.book_path}/cover.jpg`);
  }
  getThumbnailPath() {
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
}
export class BookDownloaded {
  date: Date;
  // noinspection JSUnusedGlobalSymbols
  user_id: string;
  // noinspection JSUnusedGlobalSymbols
  user_name: string;
}