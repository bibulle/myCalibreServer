import * as _ from "lodash";
import DbCalibre from "./dbCalibre";
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
  series_id: string;
  series_name: string;
  series_sort: string;
  comment: string;
  book_date: Date;

  data: BookData[];

  constructor (options: {}) {
    _.merge(this, options);

    ['data_id', 'data_format', 'data_size', 'data_name', 'tag_id', 'tag_name', 'author_sort', 'author_id', 'author_name'].forEach(name => {
      DbCalibre.splitAttribute(this, name);
    });
    ['book_date', 'timestamp', 'last_modified'].forEach(name => {
      this[name] = new Date(this[name]);
    });

    BookPath.createBookData(this);

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

  /**
   * Create noew abject and delete unused attribut
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