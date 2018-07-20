import {Router, Response, Request, NextFunction} from "express";
import DbCalibre from "../models/dbCalibre";
import {BookPath, BookData} from "../models/book";
import DbMyCalibre from "../models/dbMyCalibre";
import {CacheDate, CacheDateKey} from "../models/cacheDate";
import {User} from "../models/user";
import {SendMailOptions} from "nodemailer";

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const debug = require('debug')('server:routes:book');


function bookRouter(passport): Router {
  const router: Router = Router();


// -----------------------------------
// --     /api/route routes     --
// -----------------------------------

  router.route('/')
  // ====================================
  // route for getting books list
  // ====================================
    .get((request: Request, response: Response, next: NextFunction) => {
      debug("GET /");

      passport.authenticate('jwt-check', {session: false}, (err, user): any => {
        if (err) {
          return next(err);
        }

        if (!user) {
          const msg = 'Unauthorized';
          return response.status(401).send({status: 401, message: msg});
        }

        CacheDate.getCachePath(CacheDateKey.BOOKS)
          .then(path => {
            response.sendFile(path);
          })
          .catch(err => {
            response.status(500).json({status: 500, message: err});
          })

      })(request, response, next);
    });

  router.route('/new')
  // ====================================
  // route for getting books list
  // ====================================
    .get((request: Request, response: Response, next: NextFunction) => {
      debug("GET /new");

      passport.authenticate('jwt-check', {session: false}, (err, user): any => {
        if (err) {
          return next(err);
        }

        if (!user) {
          const msg = 'Unauthorized';
          return response.status(401).send({status: 401, message: msg});
        }

        CacheDate.getCachePath(CacheDateKey.NEW_BOOKS)
          .then(path => {
            response.sendFile(path);
          })
          .catch(err => {
            response.status(500).json({status: 500, message: err});
          })
      })(request, response, next);

    });

  router.route('/cover/:id.jpg')
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

          //response.header("Cache-Control", "public, max-age=31536000");
          let fullPath = null;
          if (book && book.book_has_cover && book.book_path) {
            fullPath = path.resolve(`${DbCalibre.CALIBRE_DIR}/${book.book_path}/cover.jpg`);
            fs.stat(fullPath, (err) => {
              if (err) {
                debug("No cover found 1");
                debug(book);
                response.sendFile(err_cover_path);
              } else {
                response.sendFile(fullPath);
              }
            })
          } else {
            debug("No cover found 2");
            debug(book);
            response.sendFile(err_cover_path);
          }
        })
        .catch(err => {
          debug("No cover found 3");
          debug(err);
          response.sendFile(err_cover_path);
        })

    });
  router.route('/thumbnail/:id.jpg')
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

          //response.header("Cache-Control", "public, max-age=31536000");
          if (book && book.book_has_cover && book.book_path) {
            const thumbnailPath = book.getThumbnailPath();
            const coverPath = book.getCoverPath();
            fs.stat(thumbnailPath, (err) => {
              if (err) {
                fs.stat(coverPath, (err) => {
                  if (err) {
                    response.sendFile(err_cover_path);
                  } else {
                    response.sendFile(coverPath);
                  }
                })
              } else {
                response.sendFile(thumbnailPath);
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
  router.route('/:id.epub')
  // ====================================
  // route for getting book
  // ====================================
    .get((request: Request, response: Response, next: NextFunction) => {

      const book_id = request.params['id'] || 0;

      debug(`GET /${book_id}.epub`);

      let token = request.query['token'];

      if (!token) {
        return response.status(401).send({error: 'unauthorized'});
      }

      User.checkToken(token, (err, user) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          const msg = 'Unauthorized';
          return response.status(401).send({status: 401, message: msg});
        }

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
                    user.addDownloadedBook(book_id, data[0]);
                    response.header("Cache-Control", "public, max-age=31536000");
                    response.header("Content-Type", "application/epub+zip");
                    response.header("Content-Disposition", `attachment; filename="${data[0].data_name}.epub"`);
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


    });
  router.route('/:id.mobi')
  // ====================================
  // route for getting book
  // ====================================
    .get((request: Request, response: Response, next: NextFunction) => {

      const book_id = request.params['id'] || 0;

      debug(`GET /${book_id}.mobi`);

      let token = request.query['token'];

      if (!token) {
        return response.status(401).send({error: 'unauthorized'});
      }

      User.checkToken(token, (err, user) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          const msg = 'Unauthorized';
          return response.status(401).send({status: 401, message: msg});
        }

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
                    user.addDownloadedBook(book_id, data[0]);
                    response.header("Cache-Control", "public, max-age=31536000");
                    response.header("Content-Type", "application/x-mobipocket-ebook");
                    response.header("Content-Disposition", `attachment; filename="${data[0].data_name}.mobi"`);
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

    });
  router.route('/:id/rating')
  // ====================================
  // route for sending book to kindle
  // ====================================
    .post((request: Request, response: Response, next: NextFunction) => {

      const book_id = request.params['id'] || 0;

      debug(`POST /${book_id}/rating`);

      debug(request.body);
      let rating = request.body['rating'];
      debug(rating);

      if (!rating) {
        return response.status(400).send({error: 'Bad Request (rating needed)'});
      }

      passport.authenticate('jwt-check', {session: false}, (err, user): any => {
        if (err) {
          return next(err);
        }

        if (!user) {
          const msg = 'Unauthorized';
          return response.status(401).send({status: 401, message: msg});
        }

        DbMyCalibre
          .getConf()
          .then(() => {

            DbCalibre.getInstance()
              .getBookPaths(book_id)
              .then((book: BookPath) => {
                // debug(book);

                if (book && book.book_path && book.data) {
                  user.addRatingBook(book_id, book.data[0].data_name, rating,
                    (error, info) => {
                      if (error) {
                        debug(error);
                        response.status(500).send({error: error});
                      } else {
                        debug("OK");
                        return response.status(200).send({ OK: info });
                      }
                    }
                  );

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
      })(request, response, next);

    });
  router.route('/:id/send/kindle')
  // ====================================
  // route for sending book to kindle
  // ====================================
    .get((request: Request, response: Response, next: NextFunction) => {

      const book_id = request.params['id'] || 0;

      debug(`GET /${book_id}/send/kindle`);

      let mail = request.query['mail'];

      if (!mail) {
        return response.status(400).send({error: 'Bad Request (mail needed)'});
      }

      passport.authenticate('jwt-check', {session: false}, (err, user): any => {
        if (err) {
          return next(err);
        }

        if (!user) {
          const msg = 'Unauthorized';
          return response.status(401).send({status: 401, message: msg});
        }

        DbMyCalibre
          .getConf()
          .then(config => {

            DbCalibre.getInstance()
              .getBookPaths(book_id)
              .then((book: BookPath) => {
                // debug(book);

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

                        user.addDownloadedBook(book_id, data[0]);
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
                        } as SendMailOptions, (error, info) => {
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
      })(request, response, next);

    });
  router.route('/:id/epub/url')
  // ====================================
  // route for getting epub url
  // ====================================
    .get((request: Request, response: Response, next: NextFunction) => {


      const book_id = request.params['id'] || 0;
      debug(`GET /${book_id}/epub/url`);

      passport.authenticate('jwt-check', {session: false}, (err, user): any => {
        if (err) {
          return next(err);
        }

        if (!user) {
          const msg = 'Unauthorized';
          return response.status(401).send({status: 401, message: msg});
        }

        let token = User.createTemporaryToken(user);

        return response.status(200).json({token: token});

      })(request, response, next);

    });
  router.route('/:id/mobi/url')
  // ====================================
  // route for getting mobi url
  // ====================================
    .get((request: Request, response: Response, next: NextFunction) => {


      const book_id = request.params['id'] || 0;
      debug(`GET /${book_id}/mobi/url`);

      passport.authenticate('jwt-check', {session: false}, (err, user): any => {
        if (err) {
          return next(err);
        }

        if (!user) {
          const msg = 'Unauthorized';
          return response.status(401).send({status: 401, message: msg});
        }

        let token = User.createTemporaryToken(user);

        return response.status(200).json({token: token});

      })(request, response, next);

    });


  return router;
}

export {bookRouter}

