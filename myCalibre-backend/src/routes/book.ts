import { Router, Response, Request } from "express";
import DbCalibre from "../models/dbCalibre";
import { BookPath, BookData } from "../models/book";
import DbMyCalibre from "../models/dbMyCalibre";
import { CacheDate, CacheDateKey } from "../models/cacheDate";
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const debug = require('debug')('server:routes:book');


const bookRouter: Router = Router();


// -----------------------------------
// --     /api/route routes     --
// -----------------------------------

bookRouter.route('/')
          // ====================================
          // route for getting books list
          // ====================================
          .get((request: Request, response: Response) => {
            debug("GET /");

            //debug(request.query);

            CacheDate.getCachePath(CacheDateKey.BOOKS)
                     .then(path => {
                       response.sendFile(path);
                     })
                     .catch(err => {
                       response.status(500).json({status: 500, message: err});
                     })

          });

bookRouter.route('/new')
          // ====================================
          // route for getting books list
          // ====================================
          .get((request: Request, response: Response) => {
            debug("GET /new");

            //debug(request.query);

            CacheDate.getCachePath(CacheDateKey.NEW_BOOKS)
                     .then(path => {
                       response.sendFile(path);
                     })
                     .catch(err => {
                       response.status(500).json({status: 500, message: err});
                     })

          });

bookRouter.route('/cover/:id.jpg')
          // ====================================
          // route for getting books cover
          // ====================================
          .get((request: Request, response: Response) => {

            const book_id = request.params['id'] || 0;

            //debug(`GET /cover/${book_id}.png`);

            //debug(request);

            const err_cover_path = path.resolve(`${__dirname}/../img//err_cover.svg`);

            DbCalibre.getInstance()
                     .getBookPaths(book_id)
                     .then(book => {
                       //debug(book);

                       response.header("Cache-Control", "public, max-age=31536000");
                       let fullPath = null;
                       if (book && book.book_has_cover && book.book_path) {
                         fullPath = path.resolve(`${DbCalibre.CALIBRE_DIR}/${book.book_path}/cover.jpg`);
                         fs.stat(fullPath, (err) => {
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
bookRouter.route('/thumbnail/:id.jpg')
          // ====================================
          // route for getting books thumbnail
          // ====================================
          .get((request: Request, response: Response) => {

            const book_id = request.params['id'] || 0;

            //debug(`GET /thumbnail/${book_id}.png`);

            //debug(request);

            const err_cover_path = path.resolve(`${__dirname}/../img//err_cover.svg`);

            DbCalibre.getInstance()
                     .getBookPaths(book_id)
                     .then(book => {
                       //debug(book);

                       response.header("Cache-Control", "public, max-age=31536000");
                       let fullPath = null;
                       if (book && book.book_has_cover && book.book_path) {
                         fullPath = path.resolve(`${DbCalibre.CALIBRE_DIR}/${book.book_path}/cover.jpg`);
                         fs.stat(fullPath, (err) => {
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
bookRouter.route('/:id.epub')
          // ====================================
          // route for getting book
          // ====================================
          .get((request: Request, response: Response) => {

            const book_id = request.params['id'] || 0;

            //debug(`GET /${book_id}.epub`);

            //debug(request);

            DbCalibre.getInstance()
                     .getBookPaths(book_id)
                     .then((book: BookPath) => {
                       //debug(book);

                       let fullPath = null;

                       if (book && book.book_path && book.data) {
                         const data = book.data.filter((bd: BookData) => {
                           return bd.data_format == 'EPUB';
                         });
                         if (data && (data.length != 0)) {
                           fullPath = path.resolve(`${DbCalibre.CALIBRE_DIR}/${book.book_path}/${data[0].data_name}.epub`);
                           fs.stat(fullPath, (err) => {
                             if (err) {
                               console.log(err);
                               response.status(404).send({error: 'Not found : ' + request.url});
                             } else {
                               response.header("Cache-Control", "public, max-age=31536000");
                               response.header("Content-Type", "application/epub+zip");
                               response.sendFile(fullPath);
                             }
                           })
                         } else {
                           response.status(404).send({error: 'Not found : ' + request.url});
                         }

                       } else {
                         response.status(404).send({error: 'Not found : ' + request.url});
                       }
                     })
                     .catch(err => {
                       debug(err);
                       response.status(404).send({error: 'Not found : ' + request.url});
                     })

          });
bookRouter.route('/:id.mobi')
          // ====================================
          // route for getting book
          // ====================================
          .get((request: Request, response: Response) => {

            const book_id = request.params['id'] || 0;

            //debug(`GET /${book_id}.mobi`);

            //debug(request);

            DbCalibre.getInstance()
                     .getBookPaths(book_id)
                     .then((book: BookPath) => {
                       //debug(book);

                       let fullPath = null;

                       if (book && book.book_path && book.data) {
                         const data = book.data.filter((bd: BookData) => {
                           return bd.data_format == 'MOBI';
                         });
                         if (data && (data.length != 0)) {
                           fullPath = path.resolve(`${DbCalibre.CALIBRE_DIR}/${book.book_path}/${data[0].data_name}.mobi`);
                           fs.stat(fullPath, (err) => {
                             if (err) {
                               console.log(err);
                               response.status(404).send({error: 'Not found : ' + request.url});
                             } else {
                               response.header("Cache-Control", "public, max-age=31536000");
                               response.header("Content-Type", "application/x-mobipocket-ebook");
                               response.sendFile(fullPath);
                             }
                           })
                         } else {
                           response.status(404).send({error: 'Not found : ' + request.url});
                         }

                       } else {
                         response.status(404).send({error: 'Not found : ' + request.url});
                       }
                     })
                     .catch(err => {
                       debug(err);
                       response.status(404).send({error: 'Not found : ' + request.url});
                     })

          });
bookRouter.route('/:id/send/kindle')
          // ====================================
          // route for sending book to kindle
          // ====================================
          .get((request: Request, response: Response) => {

            const book_id = request.params['id'] || 0;

            //debug(`GET /${book_id}.mobi`);

            let mail = request.query['mail'];

            if (!mail) {
              return response.status(400).send({error: 'Bad Request (mail needed)'});
            }

            DbMyCalibre.getInstance()
                       .getConf()
                       .then(config => {

                         DbCalibre.getInstance()
                                  .getBookPaths(book_id)
                                  .then((book: BookPath) => {
                                    //debug(book);

                                    let fullPath = null;

                                    if (book && book.book_path && book.data) {
                                      const data = book.data.filter((bd: BookData) => {
                                        return bd.data_format == 'MOBI';
                                      });
                                      if (data && (data.length != 0)) {
                                        fullPath = path.resolve(`${DbCalibre.CALIBRE_DIR}/${book.book_path}/${data[0].data_name}.mobi`);
                                        fs.stat(fullPath, (err) => {
                                          if (err) {
                                            console.log(err);
                                            response.status(404).send({error: 'Not found : ' + request.url});
                                          } else {

                                            // Send mail
                                            //var urlSmtp = `smtp${config.smtp_encryption == "SSL" ? 's' : ''}://${config.smtp_user_name}:${config.smtp_password}@${config.smtp_server_name}:${config.smtp_port}`;
                                            const urlSmtp = `smtp${config.smtp_encryption == "SSL" ? 's' : ''}://${config.smtp_user_name.replace('@', '%40')}:${config.smtp_password}@${config.smtp_server_name}`;
                                            const transporter = nodemailer.createTransport(urlSmtp);

                                            transporter.sendMail({
                                              from: `<${config.smtp_user_name}>`,
                                              to: `${mail}`,
                                              subject: 'My books',
                                              text: 'This book was sent to you by myCalibre.',
                                              attachments: [{
                                                filename: `${data[0].data_name}.mobi`,
                                                path: `${fullPath}`
                                              }]
                                            }, (error, info) => {
                                              if (error) {
                                                debug(error);
                                                response.status(500).send({error: error});
                                              } else {
                                                response.status(200).send({OK: info});
                                              }
                                            });
                                          }
                                        })
                                      } else {
                                        response.status(404).send({error: 'Not found : ' + request.url});
                                      }

                                    } else {
                                      response.status(404).send({error: 'Not found : ' + request.url});
                                    }
                                  })
                                  .catch(err => {
                                    debug(err);
                                    response.status(404).send({error: 'Not found : ' + request.url});
                                  })
                       })
                       .catch(err => {
                         debug(err);
                         response.status(500).send({error: 'System error'});
                       })

          });


export { bookRouter }

