import * as _ from "lodash";
import DbCalibre from "./dbCalibre";
import { Book } from "./book";

export class Author {

  series_id: number;
  series_name: string;
  series_sort: string;

  author_name: string[];
  author_sort: string[];
  book_date: string[];


  books: Book[];

  constructor(options: {}) {
    _.merge(this, options);

    //console.log(this);
  }

}