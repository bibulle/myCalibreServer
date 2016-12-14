import * as _ from "lodash";
import DbCalibre from "./dbCalibre";
import { Book } from "./book";
import leftPad = require("left-pad");
const debug = require('debug')('server:model:tag');

export class Tag {

  tag_id: number;
  tag_name: string;

  books: Book[];

  constructor (options: {}) {
    _.merge(this, options);

    //console.log(this);
  }

  static getAllTags (): Promise<Tag[]> {
    return new Promise((resolve, reject) => {
      DbCalibre.getInstance()
               .getBooks(1000000, 0)
               .then((books: Book[]) => {

                 const tags: Tag[] = [];
                 const tagsHash: { [id: string]: Tag } = {};

                 books.forEach(book => {
                   if (book.tag_id) {
                     book.tag_id.forEach((tag_id, tag_index) => {
                       if (!tagsHash[tag_id]) {
                         tagsHash[tag_id] = new Tag({
                           tag_id: tag_id,
                           tag_name: book.tag_name[tag_index],
                           books: []
                         });
                         tags.push(tagsHash[tag_id]);
                       }

                       tagsHash[tag_id].books.push(book);
                     })

                   }
                 });

                 // sort books in tag
                 tags.forEach(t => {
                   t.books.sort((b1, b2) => {
                     let v1 = (b1.series_sort == null ? "" : b1.series_sort + " ") + (b1.series_name == null ? "" : leftPad(b1.book_series_index, 6, 0) + " ") + b1.book_sort;
                     let v2 = (b2.series_sort == null ? "" : b2.series_sort + " ") + (b2.series_name == null ? "" : leftPad(b2.book_series_index, 6, 0) + " ") + b2.book_sort;

                     return v1.localeCompare(v2);
                   })
                 });
                 debug("done");
                 resolve(tags)
               })
               .catch(err => {
                 reject(err);
               });
    });
  }

}