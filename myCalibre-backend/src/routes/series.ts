import { Router, Response, Request } from "express";
import DbCalibre from "../models/dbCalibre";
import { Series } from "../models/series";
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

                           var series: Series[] = [];
                           var seriesHash: { [id: string]: Series } = {};

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


                           response.json({data: series})
                         })
                         .catch(err => {
                           response.status(500).json({status: 500, message: err});
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
