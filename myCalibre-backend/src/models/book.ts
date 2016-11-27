import * as _ from "lodash";
import DbCalibre from "./dbCalibre";

export class Book {

  book_id: number;
  book_title: string;
  book_sort: string;
  author_sort: string;
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
  data_id: string;
  data_format: string;
  data_name: string;
  data_size: string;
  comment: string;
  book_date: string;

  constructor(options: {}) {
    _.merge(this, options);

    [ 'data_id', 'data_format', 'data_size', 'data_name', 'tag_id', 'tag_name', 'author_sort', 'author_id', 'author_name'].forEach( name => {
      DbCalibre.splitAttribute(this, name);
    })
  }
}

export class BookPath {

  book_id: number;
  book_has_cover: string;
  book_path: string;

  constructor(options: {}) {
    _.merge(this, options);

  }
}