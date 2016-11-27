import * as _ from "lodash";
import DbCalibre from "./dbCalibre";
import { Book } from "./book";

export class Series {

  series_id: number;
  series_name: string;
  series_sort: string;

  books: Book[];

  constructor(options: {}) {
    _.merge(this, options);

    //console.log(this);
  }

}