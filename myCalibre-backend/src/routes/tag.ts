import { Router, Response, Request } from "express";
import DbCalibre from "../models/dbCalibre";
import { Book } from "../models/book";
import leftPad = require("left-pad");
import { Tag } from "../models/tag";
const fs = require('fs');
const path = require('path');

const debug = require('debug')('server:routes:tag');


const tagRouter: Router = Router();


// -----------------------------------
// --     /api/tag routes     --
// -----------------------------------

tagRouter.route('/')
            // ====================================
            // route for getting tag list
            // ====================================
            .get((request: Request, response: Response) => {
              debug("GET /");

              //debug(request.query);

              let limit = request.query['limit'] || 1000000;
              let offset = request.query['offset'] || 0;


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
                         response.json({ data: tags })
                       })
                       .catch(err => {
                         response.status(500).json({ status: 500, message: err });
                       });

            });


export { tagRouter }

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
