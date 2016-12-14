import { Router, Response, Request } from "express";
import { CacheDate, CacheDateKey } from "../models/cacheDate";
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

              //debug(request.query);

              CacheDate.getCachePath(CacheDateKey.AUTHORS)
                       .then(path => {
                         response.sendFile(path);
                       })
                       .catch(err => {
                         response.status(500).json({status: 500, message: err});
                       })
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
