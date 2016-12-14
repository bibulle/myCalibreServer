import { Router, Response, Request } from "express";
import { CacheDate, CacheDateKey } from "../models/cacheDate";
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

              CacheDate.getCachePath(CacheDateKey.SERIES)
                       .then(path => {
                         response.sendFile(path);
                       })
                       .catch(err => {
                         response.status(500).json({status: 500, message: err});
                       })

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
