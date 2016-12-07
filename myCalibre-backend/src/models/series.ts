import * as _ from "lodash";
import { Book } from "./book";

export class Series {

  series_id: number;
  series_name: string;
  series_sort: string;

  author_name: string[];
  author_sort: string[];
  book_date: Date[];


  books: Book[];

  constructor(options: {}) {
    _.merge(this, options);

    //console.log(this);
  }

}