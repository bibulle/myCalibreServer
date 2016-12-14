import { Router, Response, Request } from "express";
import { CacheDate, CacheDateKey } from "../models/cacheDate";
import leftPad = require("left-pad");
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

              CacheDate.getCachePath(CacheDateKey.TAGS)
                       .then(path => {
                         response.sendFile(path);
                       })
                       .catch(err => {
                         response.status(500).json({status: 500, message: err});
                       })

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
