import * as _ from "lodash";
const debug = require('debug')('server:model:series');

import { Book } from "./book";
import DbCalibre from "./dbCalibre";

export class Series {

  series_id: number;
  series_name: string;
  series_sort: string;

  author_name: string[];
  author_sort: string[];
  book_date: Date[];


  books: Book[];

  constructor (options: {}) {
    _.merge(this, options);

    //console.log(this);
  }

  static getAllSeries (): Promise<Series[]> {
    return new Promise((resolve, reject) => {
      DbCalibre.getInstance()
               .getBooks(1000000, 0)
               .then((books: Book[]) => {

                 const series: Series[] = [];
                 const seriesHash: { [id: string]: Series } = {};

                 books.forEach(book => {
                   if (book.series_id) {
                     if (!seriesHash[book.series_id]) {
                       seriesHash[book.series_id] = new Series({
                         series_id: book.series_id,
                         series_name: book.series_name,
                         series_sort: book.series_sort,
                         books: []
                       });
                       series.push(seriesHash[book.series_id]);
                     }

                     seriesHash[book.series_id].books.push(book);
                     seriesHash[book.series_id].books.sort((b1, b2) => {
                       return b1.book_series_index - b2.book_series_index;
                     })

                   }
                 });

                 // fill series with books info
                 series.forEach((s: Series) => {
                   s.author_name = [];
                   s.author_sort = [];
                   s.book_date = [];

                   s.books.forEach((b: Book) => {
                     if (b.book_date.getFullYear() > 1000) {
                       s.book_date.push(b.book_date);
                     }
                     s.author_name = s.author_name.concat(b.author_name);
                     s.author_sort = s.author_sort.concat(b.author_sort);
                   });

                   s.book_date = s.book_date
                                  .reduce((result:Date[], current:Date) => {
                                    if (result.filter(d => {return d.getFullYear() == current.getFullYear()}).length == 0) {
                                      result.push(current);
                                    }
                                    return result;
                                  }, [])
                                  .sort();
                   s.author_name = s.author_name
                                    .reduce((result, current) => {
                                      if (result.filter(d => {return d == current}).length == 0) {
                                        result.push(current);
                                      }
                                      return result;
                                    }, [])
                                    .sort();
                   s.author_sort = s.author_sort
                                    .reduce((result, current) => {
                                      if (result.filter(d => {return d == current}).length == 0) {
                                        result.push(current);
                                      }
                                      return result;
                                    }, [])
                                    .sort();

                 });

                 debug("done");
                 resolve(series)
               })
               .catch(err => {
                 reject(err);
               });
    });
  }
}