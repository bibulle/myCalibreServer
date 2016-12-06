import { Router, Response, Request } from "express";
import DbCalibre from "../models/dbCalibre";
import { Author } from "../models/series";
import { Book } from "../models/book";
var fs = require('fs');
var path = require('path');

var debug = require('debug')('server:routes:series');


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

                         var series: Author[] = [];
                         var seriesHash: { [id: string]: Author } = {};

                         books.forEach(book => {
                           if (book.series_id) {
                             if (!seriesHash[book.series_id]) {
                               seriesHash[book.series_id] = new Author({
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
                         series.forEach((s: Author) => {
                           s.author_name = [];
                           s.author_sort = [];
                           s.book_date = [];

                           s.books.forEach((b: Book) => {
                             if (b.book_date > '011') {
                               s.book_date.push(b.book_date);
                             }
                             s.author_name = s.author_name.concat(b.author_name);
                             s.author_sort = s.author_sort.concat(b.author_sort);
                           });

                           s.book_date = s.book_date
                                          .reduce((accu, current, index, array) => {
                                            if (accu.filter(d => {return d.substring(0, 4) == current.substring(0, 4)}).length == 0) {
                                              accu.push(current);
                                            }
                                            return accu;
                                          }, [])
                                          .sort();
                           s.author_name = s.author_name
                                            .reduce((accu, current, index, array) => {
                                              if (accu.filter(d => {return d == current}).length == 0) {
                                                accu.push(current);
                                              }
                                              return accu;
                                            }, [])
                                            .sort();
                           s.author_sort = s.author_sort
                                            .reduce((accu, current, index, array) => {
                                              if (accu.filter(d => {return d == current}).length == 0) {
                                                accu.push(current);
                                              }
                                              return accu;
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

/**
 * Split an attribut separate by pipe to an array
 * @param row
 * @param name
 */
function _splitAttribute (row, name) {
  if (row[name]) {
    //console.log(row[name]+" -> "+row[name].split('|'))
    row[name] = row[name].split('|');
  } else {
    row[name] = [];
  }
}
