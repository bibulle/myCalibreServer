import { Router, Response, Request } from "express";
import { CacheDate, CacheDateKey } from "../models/cacheDate";
import { Series } from "../models/series";
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

seriesRouter.route('/thumbnail/:id.png')
            // ====================================
            // route for getting series thumbnail
            // ====================================
            .get((request: Request, response: Response) => {

              const series_id = request.params['id'] || 0;

              debug(`GET /thumbnail/${series_id}.png`);

              //debug(request);

              const err_cover_path = path.resolve(`${__dirname}/../img//err_cover.svg`);

              // create a fake series
              const thumbnailPath = new Series({series_id: series_id}).getThumbnailPath();
              fs.stat(thumbnailPath, (err) => {
                if (err) {
                  response.sendFile(err_cover_path);
                } else {
                  response.sendFile(thumbnailPath);
                }
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
