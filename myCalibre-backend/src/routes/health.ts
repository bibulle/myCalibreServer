import {Request, Response, Router} from "express";
import DbCalibre from "../models/dbCalibre";
import DbMyCalibre from "../models/dbMyCalibre";
import {CacheDate, CacheDateKey} from "../models/cacheDate";
import async = require("async");

const debug = require('debug')('server:routes:health');


const healthRouter: Router = Router();

healthRouter.route('/')
// ====================================
// route for getting series list
// ====================================
    .get((request: Request, response: Response) => {
        debug("GET /");

        async.parallel([
                (callback) => {
                    DbMyCalibre.getConf()
                        .then(config => {
                            if (config && config.authent_digest) {
                                callback(null, "Config OK")
                            } else {
                                debug("Config KO");
                                callback(Error("Config KO"))
                            }
                        })
                        .catch(reason => {
                            callback(reason);
                        });
                },
                (callback) => {
                    DbCalibre.getInstance().getDbDate()
                        .then(date => {
                            if (date) {
                                callback(null, "Calibre date OK ("+date.toLocaleDateString()+" "+date.toLocaleTimeString()+")")
                            } else {
                                debug("Calibre date KO");
                                callback(Error("Calibre date KO"))
                            }
                        })
                        .catch(reason => {
                            callback(reason);
                        })

                },
                (callback) => {
                    DbCalibre.getInstance().getBooks(100)
                        .then(books => {
                            if (books && (books.length == 100)) {
                                callback(null, "Calibre Db OK")
                            } else {
                                debug("Calibre Db KO");
                                callback(Error("Calibre Db KO"))
                            }
                        })
                        .catch(reason => {
                            callback(reason);
                        })

                },
                (callback) => {
                    CacheDate.getCachePath(CacheDateKey.AUTHORS)
                        .then(() => {

                            callback(null, "Cached authors OK ")
                        })
                        .catch(err => {
                            debug(err);
                            callback(Error("Cached authors KO"));
                        })
                },
                (callback) => {
                    CacheDate.getCachePath(CacheDateKey.BOOKS)
                        .then(() => {

                            callback(null, "Cached books OK ")
                        })
                        .catch(err => {
                            debug(err);
                            callback(Error("Cached books KO"));
                        })
                },
                (callback) => {
                    CacheDate.getCachePath(CacheDateKey.NEW_BOOKS)
                        .then(() => {

                            callback(null, "Cached new books OK ")
                        })
                        .catch(err => {
                            debug(err);
                            callback(Error("Cached new books KO"));
                        })
                },
                (callback) => {
                    CacheDate.getCachePath(CacheDateKey.SERIES)
                        .then(() => {

                            callback(null, "Cached series OK ")
                        })
                        .catch(err => {
                            debug(err);
                            callback(Error("Cached series KO"));
                        })
                },
                (callback) => {
                    CacheDate.getCachePath(CacheDateKey.TAGS)
                        .then(() => {

                            callback(null, "Cached tags OK ")
                        })
                        .catch(err => {
                            debug(err);
                            callback(Error("Cached tags KO"));
                        })
                },

            ],
            (err, results) => {
                if (err) {
                    response.status(203).json({status: 203, message: err});
                } else {
                    response.status(200).json({status: 200, message: results});
                }
            });

    });


export {healthRouter}

