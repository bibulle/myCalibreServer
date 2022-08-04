import { ApiReturn, BookData, BookPath, User } from '@my-calibre-server/api-interfaces';
import { Body, Controller, Get, Header, HttpException, HttpStatus, Logger, Param, Post, Query, Req, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { createReadStream, promises as fsPromises } from 'fs';
import { CacheDateKey, CacheService } from '../cache/cache.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';
import { UsersService } from '../users/users.service';
import { BooksService } from './books.service';
import path = require('path');
import { MailService } from '../utils/mail.service';

@Controller('book')
export class BooksController {
  readonly logger = new Logger(BooksController.name);

  constructor(
    private _booksService: BooksService,
    private _cacheService: CacheService,
    private _calibreDb: CalibreDb1Service,
    private _usersService: UsersService,
    private _configService: ConfigService,
    private _mailService: MailService
  ) {}

  // ====================================
  // route for getting books
  // ====================================
  @Get('')
  @UseGuards(AuthGuard('jwt'))
  async getBooks(): Promise<StreamableFile> {
    return new Promise<StreamableFile>((resolve) => {
      this._cacheService
        .getCachePath(CacheDateKey.BOOKS)
        .then((path) => {
          const file = createReadStream(path);
          resolve(new StreamableFile(file));
        })
        .catch((err) => {
          this.logger.error(err);
          throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });
  }

  // ====================================
  // route for getting new books
  // ====================================
  @Get('/new')
  @UseGuards(AuthGuard('jwt'))
  async new(): Promise<StreamableFile> {
    return new Promise<StreamableFile>((resolve) => {
      this._cacheService
        .getCachePath(CacheDateKey.NEW_BOOKS)
        .then((path) => {
          const file = createReadStream(path);
          resolve(new StreamableFile(file));
        })
        .catch((err) => {
          this.logger.error(err);
          throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });
  }

  // ====================================
  // route for getting a book
  // ====================================
  @Get('/:id')
  @UseGuards(AuthGuard('jwt'))
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getBook(@Param('id') book_id: number): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      this._calibreDb
        .getBook(book_id, this._usersService.getAll())
        .then((book) => {
          const ret: ApiReturn = {};
          ret.book = book;
          resolve(ret);
        })
        .catch((err) => {
          this.logger.error(err);
          throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });
  }
  // ====================================
  // route for getting books cover
  // ====================================
  @Get('/cover/:id.jpg')
  async getCover(@Param('id') book_id: number, @Res({ passthrough: true }) res): Promise<StreamableFile> {
    const err_cover_path = path.resolve(`${__dirname}/assets//err_cover.svg`);

    return new Promise<StreamableFile>((resolve) => {
      this._calibreDb
        .getBookPaths(book_id)
        .then((bookpath) => {
          if (bookpath && bookpath.book_has_cover && bookpath.book_path) {
            const coverPath = this._booksService.getCoverPath(bookpath);

            fsPromises
              .stat(coverPath)
              .then(() => {
                res.set({
                  'Content-Type': 'image/jpg',
                  'Cache-control': 'public, max-age=3600',
                });

                resolve(new StreamableFile(createReadStream(coverPath)));
              })
              .catch(() => {
                res.set({
                  'Content-Type': 'image/svg+xml',
                  'Cache-control': 'public, max-age=3600',
                });
                resolve(new StreamableFile(createReadStream(err_cover_path)));
              });
          } else {
            res.set({
              'Content-Type': 'image/svg+xml',
              'Cache-control': 'public, max-age=3600',
            });
            resolve(new StreamableFile(createReadStream(err_cover_path)));
          }
        })
        .catch((err) => {
          this.logger.error(err);
          res.set({
            'Content-Type': 'image/svg+xml',
            'Cache-control': 'public, max-age=3600',
          });
          resolve(new StreamableFile(createReadStream(err_cover_path)));
        });
    });
  }
  // ====================================
  // route for getting books thumbnail
  // ====================================
  @Get('/thumbnail/:id.jpg')
  async getThumbnail(@Param('id') book_id: number, @Res({ passthrough: true }) res): Promise<StreamableFile> {
    const err_cover_path = path.resolve(`${__dirname}/assets//err_cover.svg`);

    return new Promise<StreamableFile>((resolve) => {
      this._calibreDb
        .getBookPaths(book_id)
        .then((bookpath) => {
          if (bookpath && bookpath.book_has_cover && bookpath.book_path) {
            const thumbnailPath = this._booksService.getThumbnailPath(bookpath);
            const coverPath = this._booksService.getCoverPath(bookpath);

            fsPromises
              .stat(thumbnailPath)
              .then(() => {
                res.set({
                  'Content-Type': 'image/jpg',
                  'Cache-Control': 'max-age=31536000',
                });
                resolve(new StreamableFile(createReadStream(thumbnailPath)));
              })
              .catch(() => {
                fsPromises
                  .stat(coverPath)
                  .then(() => {
                    res.set({
                      'Content-Type': 'image/jpg',
                      'Cache-control': 'public, max-age=3600',
                    });

                    resolve(new StreamableFile(createReadStream(coverPath)));
                  })
                  .catch(() => {
                    res.set({
                      'Content-Type': 'image/svg+xml',
                      'Cache-control': 'public, max-age=3600',
                    });
                    resolve(new StreamableFile(createReadStream(err_cover_path)));
                  });
              });
          } else {
            res.set({
              'Content-Type': 'image/svg+xml',
              'Cache-control': 'public, max-age=3600',
            });
            resolve(new StreamableFile(createReadStream(err_cover_path)));
          }
        })
        .catch((err) => {
          this.logger.error(err);
          res.set({
            'Content-Type': 'image/svg+xml',
            'Cache-control': 'public, max-age=3600',
          });
          resolve(new StreamableFile(createReadStream(err_cover_path)));
        });
    });
  }

  // ====================================
  // route for downloading book
  // ====================================
  @Get('/:id/epub')
  async getEpub(@Param('id') book_id: number, @Query('token') token: string, @Res({ passthrough: true }) res): Promise<StreamableFile> {
    return this._booksService.getBookToDownload(token, book_id, res, 'EPUB', 'application/epub+zip');
  }
  @Get('/:id/mobi')
  async getMobi(@Param('id') book_id: number, @Query('token') token: string, @Res({ passthrough: true }) res): Promise<StreamableFile> {
    return this._booksService.getBookToDownload(token, book_id, res, 'MOBI', 'application/x-mobipocket-ebook');
  }

  // ====================================
  // route for downloading book
  // ====================================
  @Post('/:id/rating')
  @UseGuards(AuthGuard('jwt'))
  async setRating(@Param('id') book_id: number, @Body('rating') rating: number, @Req() req): Promise<ApiReturn> {
    // this.logger.debug(book_id);
    // this.logger.debug(rating);

    return new Promise<ApiReturn>((resolve) => {
      if (!rating) {
        throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
      }

      const user: User = req.user as User;

      this._calibreDb
        .getBookPaths(book_id)
        .then((book: BookPath) => {
          // debug(book);

          if (book && book.book_path && book.data) {
            this._usersService
              .addRatingBook(user, book_id, book.data[0].data_name, rating)
              .then(() => {
                resolve({ ok: 'Rating saved' });
              })
              .catch((reason) => {
                this.logger.error(reason);
                throw new HttpException('Something go wrong :-(', HttpStatus.INTERNAL_SERVER_ERROR);
              });
          } else {
            throw new HttpException('Not found', HttpStatus.NOT_FOUND);
          }
        })
        .catch((err) => {
          this.logger.error(err);
          throw new HttpException('Not found', HttpStatus.NOT_FOUND);
        });
    });
  }

  // ====================================
  // route for getting epub url
  // ====================================
  @Get('/:id/:type/url')
  @UseGuards(AuthGuard('jwt'))
  async getEpubUrl(@Param('id') book_id: number, @Req() req): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      const user: User = req.user as User;
      if (!user) {
        throw new HttpException('Something go wrong', HttpStatus.UNAUTHORIZED);
      }

      const token = this._usersService.createTemporaryToken(user);

      const ret: ApiReturn = {};
      ret.id_token = token;
      resolve(ret);
    });
  }

  @Get(':id/send/kindle')
  @UseGuards(AuthGuard('jwt'))
  async sendKindle(@Param('id') book_id: number, @Query('mail') mail, @Req() req): Promise<ApiReturn> {
    try {
      const user: User = req.user as User;
      if (!user) {
        throw new HttpException('Something go wrong', HttpStatus.UNAUTHORIZED);
      }
      if (!mail || !book_id) {
        throw new HttpException('Something go wrong', HttpStatus.BAD_REQUEST);
      }
      const book = await this._calibreDb.getBookPaths(book_id);
      let fullPath = null;

      if (book && book.book_path && book.data) {
        const data = book.data.filter((bd: BookData) => {
          return bd.data_format == 'EPUB';
        });
        if (data && data.length != 0) {
          fullPath = path.resolve(`${CalibreDb1Service.CALIBRE_DIR}/${book.book_path}/${data[0].data_name}.epub`);
          const stats = await fsPromises.stat(fullPath);
          if (stats) {
            await this._usersService.addDownloadedBook(user, book_id, data[0]);
            await this._mailService.sendMail(mail, 'My books', 'This book was sent to you by myCalibre.', `${data[0].data_name}.epub`, `${fullPath}`);
            return { ok: 'Book sent' };
          } else {
            throw new HttpException('Not found', HttpStatus.NOT_FOUND);
          }
        } else {
          throw new HttpException('Not found', HttpStatus.NOT_FOUND);
        }
      } else {
        throw new HttpException('Not found', HttpStatus.NOT_FOUND);
      }
    } catch (err) {
      let mes = 'Something go wrong';
      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      if (err && err.code === 'ENOENT') {
        mes = 'Not found'
        status = HttpStatus.NOT_FOUND;
      } else if (err && err.status) {
        status = err.status;
      }
      this.logger.error(err);
      this.logger.error(JSON.stringify(err, null,2));
      throw new HttpException(mes, status);
    }
  }
}
