import * as _ from "lodash";
import leftPad = require("left-pad");

import { Book } from "./book";
import DbCalibre from "./dbCalibre";
const debug = require('debug')('server:model:author');


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

  static getAllAuthors(): Promise<Author[]> {

    return new Promise((resolve, reject) => {
      DbCalibre.getInstance()
               .getBooks(1000000, 0)
               .then((books: Book[]) => {

                 const authors: Author[] = [];
                 const authorsHash: { [id: string]: Author } = {};

                 books.forEach(book => {
                   if (book.author_id) {
                     book.author_id.forEach((author_id, author_index) => {
                       if (!authorsHash[author_id]) {
                         authorsHash[author_id] = new Author({
                           author_id: author_id,
                           author_name: book.author_name[author_index],
                           author_sort: book.author_sort[author_index],
                           books: []
                         });
                         authors.push(authorsHash[author_id]);
                       }

                       authorsHash[author_id].books.push(book);
                     })

                   }
                 });

                 // fill authors with books info and sort books
                 authors.forEach((a: Author) => {
                   a.book_date = [];

                   a.books.forEach((b: Book) => {
                     if (b.book_date.getFullYear() > 1000) {
                       a.book_date.push(b.book_date);
                     }
                   });

                   a.book_date = a.book_date
                                  .reduce((result:Date[], current:Date) => {
                                    if (result.filter(d => {return d.getFullYear() == current.getFullYear()}).length == 0) {
                                      result.push(current);
                                    }
                                    return result;
                                  }, [])
                                  .sort();

                   a.books.sort((b1, b2) => {
                     let v1 = (b1.series_sort == null ? "" : b1.series_sort + " ") + (b1.series_name == null ? "" : leftPad(b1.book_series_index, 6, 0) + " ") + b1.book_sort;
                     let v2 = (b2.series_sort == null ? "" : b2.series_sort + " ") + (b2.series_name == null ? "" : leftPad(b2.book_series_index, 6, 0) + " ") + b2.book_sort;

                     return v1.localeCompare(v2);
                   })
                 });

                 debug("done");
                 resolve(authors)
               })
               .catch(err => {
                 console.log(err);
                 reject(err);
               });


    });

  }

}