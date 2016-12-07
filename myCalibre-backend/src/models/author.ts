import * as _ from "lodash";
import { Book } from "./book";

export class Author {

  author_id: number;
  author_name: string;
  author_sort: string;

  book_date: Date[];

  books: Book[];

  constructor(options: {}) {
    _.merge(this, options);

    //console.log(this);
  }

}