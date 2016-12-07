import { Router, Response, Request } from "express";
import DbCalibre from "../models/dbCalibre";
import { Series } from "../models/series";
import { Book } from "../models/book";
const fs = require('fs');
const path = require('path');

const debug = require('debug')('server:routes:series');


const seriesRouter: Router = Router();


// -----------------------------------
// --     /api/series routes     --
// -----------------------------------

seriesRouter.route('/')
            // ====================================
            // route for getting series list
            // ====================================
            .get((request: Request, response: Response) => {
              debug("GET /");

              //debug(request.query);

              let limit = request.query['limit'] || 1000000;
              let offset = request.query['offset'] || 0;


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


                         response.json({ data: series })
                       })
                       .catch(err => {
                         response.status(500).json({ status: 500, message: err });
                       });

            });


export { seriesRouter }

// /**
//  * Split an attribute separate by pipe to an array
//  * @param row
//  * @param name
//  */
// function _splitAttribute (row, name) {
//   if (row[name]) {
//     //console.log(row[name]+" -> "+row[name].split('|'))
//     row[name] = row[name].split('|');
//   } else {
//     row[name] = [];
//   }
// }
