import { Router, Response, Request } from "express";
import DbCalibre from "../models/dbCalibre";

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

            debug(request.query);

            let limit = request.query['limit'] || 1000000;
            let offset = request.query['offset'] || 0;


            DbCalibre.getInstance()
                     .getBooks(limit, offset)
                     .then(rows => {
                       debug("GET /... respond");
                       response.json({data: rows})
                       debug("GET /... respond");
                     })
                     .catch(err => {
                       response.status(500).json({status: 500, message: err});
                     });

          });


export { bookRouter }