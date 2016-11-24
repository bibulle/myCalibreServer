import { Router, Response, Request } from "express";
import DbCalibre from "../models/dbCalibre";
var fs = require('fs');
var path = require('path');

var debug = require('debug')('server:routes:book');


const bookRouter: Router = Router();


// -----------------------------------
// --     /api/job routes     --
// -----------------------------------

bookRouter.route('/')
          // ====================================
          // route for getting books list
          // ====================================
          .get((request: Request, response: Response) => {
            debug("GET /");

            //debug(request.query);

            let limit = request.query['limit'] || 1000000;
            let offset = request.query['offset'] || 0;


            DbCalibre.getInstance()
                     .getBooks(limit, offset)
                     .then(rows => {

                       rows.map(row => {
                         [ 'data_id', 'data_format', 'data_size', 'data_name', 'tag_id', 'tag_name', 'author_sort', 'author_id', 'author_name'].forEach( name => {
                           _splitAttribute(row, name)
                         })
                         return row;
                       })

                       debug("GET /... respond");
                       response.json({data: rows})
                       debug("GET /... respond");
                     })
                     .catch(err => {
                       response.status(500).json({status: 500, message: err});
                     });

          });

bookRouter.route('/thumbnail/:id.jpg')
          // ====================================
          // route for getting books thumbnail
          // ====================================
          .get((request: Request, response: Response) => {

            var book_id = request.params['id'] || 0;

            //debug(`GET /thumbnail/${book_id}.png`);

            //debug(request);

            var err_cover_path = path.resolve(`${__dirname}/../img//err_cover.svg`)

            DbCalibre.getInstance()
                     .getBookPaths(book_id)
                     .then( book => {
                       //debug(book);

                       response.header("Cache-Control", "public, max-age=31536000");
                       var fullPath = null;
                       if (book && book.book_has_cover && book.book_path) {
                         fullPath = path.resolve(`./data/${book.book_path}/cover.jpg`);
                         fs.stat(fullPath,(err, stats) => {
                           if (err) {
                             response.sendFile(err_cover_path);
                           } else {
                             response.sendFile(fullPath);
                           }
                         })
                       } else {
                         response.sendFile(err_cover_path);
                       }
                     })
                     .catch(err => {
                       debug(err);
                       response.sendFile(err_cover_path);
                     })

          });


export { bookRouter }

/**
 * Split an attribut separate by pipe to an array
 * @param row
 * @param name
 */
function _splitAttribute(row, name) {
  if (row[name]) {
    //console.log(row[name]+" -> "+row[name].split('|'))
    row[name] = row[name].split('|');
  } else {
    row[name] = [];
  }
}