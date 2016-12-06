import * as _ from "lodash";
import DbCalibre from "./dbCalibre";
import { Book } from "./book";

export class Tag {

  tag_id: number;
  tag_name: string;

  books: Book[];

  constructor(options: {}) {
    _.merge(this, options);

    //console.log(this);
  }

}