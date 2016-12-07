import { Router, Response, Request } from "express";
import DbCalibre from "../models/dbCalibre";
import { Author } from "../models/author";
import { Book } from "../models/book";
import leftPad = require("left-pad");
const fs = require('fs');
const path = require('path');

const debug = require('debug')('server:routes:author');


const authorRouter: Router = Router();


// -----------------------------------
// --     /api/author routes     --
// -----------------------------------

authorRouter.route('/')
            // ====================================
            // route for getting author list
            // ====================================
            .get((request: Request, response: Response) => {
              debug("GET /");

              debug(request.query);

              let limit = request.query['limit'] || 1000000;
              let offset = request.query['offset'] || 0;


              DbCalibre.getInstance()
                       .getBooks(1000000, 0)
                       .then((books: Book[]) => {
                debug("then");

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
                               authorsHash[author_id].books.sort((b1, b2) => {
                                 let v1 = (b1.series_sort == null ? "" : b1.series_sort + " ") + (b1.series_name == null ? "" : leftPad(b1.book_series_index, 6, 0) + " ") + b1.book_sort;
                                 let v2 = (b2.series_sort == null ? "" : b2.series_sort + " ") + (b2.series_name == null ? "" : leftPad(b2.book_series_index, 6, 0) + " ") + b2.book_sort;

                                 return v1.localeCompare(v2);
                               })
                             })

                           }
                         });

                         // fill authors with books info
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

                         });


                         response.json({ data: authors })
                       })
                       .catch(err => {
                         debug("catch");
                         console.log(err);
                         response.status(500).json({ status: 500, message: err });
                       });

            });


export { authorRouter }

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
