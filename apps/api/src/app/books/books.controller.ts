import { ApiReturn, BookData, BookPath, User } from '@my-calibre-server/api-interfaces';
import { Body, Controller, Get, Header, Headers, HttpException, Logger, NotFoundException, Param, Post, Query, Req, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { createReadStream, existsSync, promises as fsPromises, statSync } from 'fs';
import { CacheKey, CacheService } from '../cache/cache.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';
import { ApiBadRequestException } from '../exceptions/api-bad-request.exception';
import { ApiInternalServerException } from '../exceptions/api-internal-server.exception';
import { ApiUnauthorizedException } from '../exceptions/api-unauthorized.exception';
import { BookNotFoundException } from '../exceptions/book-not-found.exception';
import { UsersService } from '../users/users.service';
import { MailService } from '../utils/mail.service';
import { BooksService } from './books.service';
import path = require('path');

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
  async getBooks(@Headers() headers: Record<string, string>, @Res() res): Promise<StreamableFile | void> {
    try {
      const path = await this._cacheService.getCachePath(CacheKey.BOOKS);
      const stats = statSync(path);
      const etag = stats.mtimeMs.toString();
      if (headers['if-none-match'] === etag) {
        return res.status(304).send();
      }

      res.set({
        ETag: etag,
      });

      const file = createReadStream(path);
      file.pipe(res);
    } catch (err) {
      this.logger.error(err);
      throw new ApiInternalServerException('Unable to read books cache');
    }
  }

  // ====================================
  // route for getting new books
  // ====================================
  @Get('/new')
  @UseGuards(AuthGuard('jwt'))
  async new(@Headers() headers: Record<string, string>, @Res() res): Promise<void> {
    try {
      const path = await this._cacheService.getCachePath(CacheKey.NEW_BOOKS);
      const stats = statSync(path);
      const etag = stats.mtimeMs.toString();

      res.set({
        ETag: etag,
      });

      if (headers['if-none-match'] === etag) {
        this.logger.log('  Done : BooksController new 304');
        return res.status(304).send();
      }

      const file = createReadStream(path);
      file.pipe(res);
    } catch (err) {
      this.logger.error(err);
      throw new ApiInternalServerException('Unable to read new books cache');
    }
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
    try {
      const book = await this._calibreDb.getBook(book_id, this._usersService.getAll());
      const ret: ApiReturn = {};
      ret.book = book;
      return ret;
    } catch (err) {
      this.logger.error(err);
      throw new ApiInternalServerException('Unable to load book details');
    }
  }
  // ====================================
  // route for getting books cover
  // ====================================
  @Get('/cover/:id.jpg')
  async getCover(@Param('id') book_id: number, @Res({ passthrough: true }) res): Promise<StreamableFile> {
    const err_cover_path = CacheService.ERR_COVER;

    try {
      const bookpath = await this._calibreDb.getBookPaths(book_id);
      if (bookpath && bookpath.book_has_cover && bookpath.book_path) {
        const coverPath = this._booksService.getCoverPath(bookpath);

        try {
          await fsPromises.stat(coverPath);
          res.set({
            'Content-Type': 'image/jpg',
            'Cache-control': 'public, max-age=3600',
          });

          return new StreamableFile(createReadStream(coverPath));
        } catch {
          res.set({
            'Content-Type': 'image/svg+xml',
            'Cache-control': 'public, max-age=3600',
          });
          return new StreamableFile(createReadStream(err_cover_path));
        }
      } else {
        res.set({
          'Content-Type': 'image/svg+xml',
          'Cache-control': 'public, max-age=3600',
        });
        return new StreamableFile(createReadStream(err_cover_path));
      }
    } catch (err) {
      this.logger.error(err);
      res.set({
        'Content-Type': 'image/svg+xml',
        'Cache-control': 'public, max-age=3600',
      });
      return new StreamableFile(createReadStream(err_cover_path));
    }
  }
  // ====================================
  // route for getting books thumbnail
  // ====================================
  @Get('/thumbnail/:id.jpg')
  async getThumbnail(@Param('id') book_id: number, @Res({ passthrough: true }) res): Promise<StreamableFile> {
    const err_cover_path = CacheService.ERR_COVER;

    try {
      const bookpath = await this._calibreDb.getBookPaths(book_id);
      if (bookpath && bookpath.book_has_cover && bookpath.book_path) {
        const thumbnailPath = this._booksService.getThumbnailPath(bookpath);
        const coverPath = this._booksService.getCoverPath(bookpath);

        try {
          await fsPromises.stat(thumbnailPath);
          res.set({
            'Content-Type': 'image/jpg',
            'Cache-Control': 'max-age=31536000',
          });
          return new StreamableFile(createReadStream(thumbnailPath));
        } catch {
          try {
            await fsPromises.stat(coverPath);
            res.set({
              'Content-Type': 'image/jpg',
              'Cache-control': 'public, max-age=3600',
            });

            return new StreamableFile(createReadStream(coverPath));
          } catch {
            res.set({
              'Content-Type': 'image/svg+xml',
              'Cache-control': 'public, max-age=3600',
            });
            return new StreamableFile(createReadStream(err_cover_path));
          }
        }
      } else {
        res.set({
          'Content-Type': 'image/svg+xml',
          'Cache-control': 'public, max-age=3600',
        });
        return new StreamableFile(createReadStream(err_cover_path));
      }
    } catch (err) {
      this.logger.error(err);
      res.set({
        'Content-Type': 'image/svg+xml',
        'Cache-control': 'public, max-age=3600',
      });
      return new StreamableFile(createReadStream(err_cover_path));
    }
  }

  // ====================================
  // route for getting books thumbnail sprites
  // ====================================
  @Get('/sprite/:id.png')
  async getSprite(@Param('id') sprite_id: number, @Headers() headers: Record<string, string>, @Res() res): Promise<void> {
    const spritePath = this._booksService.getSpritesPath(sprite_id);

    if (!existsSync(spritePath)) {
      throw new NotFoundException();
    }
    const stats = statSync(spritePath);
    const etag = stats.mtimeMs.toString();
    if (headers['if-none-match'] === etag) {
      return res.status(304).send();
    }

    res.set({
      'Content-Type': 'image/png',
      ETag: etag,
    });

    createReadStream(spritePath).pipe(res);
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

    if (!rating) {
      throw new ApiBadRequestException('Rating is required');
    }

    const user: User = req.user as User;

    try {
      const book: BookPath = await this._calibreDb.getBookPaths(book_id);
      // debug(book);

      if (book && book.book_path && book.data) {
        try {
          await this._usersService.addRatingBook(user, book_id, book.data[0].data_name, rating);
          return { ok: 'Rating saved' };
        } catch (reason) {
          this.logger.error(reason);
          throw new ApiInternalServerException('Unable to save book rating');
        }
      } else {
        throw new BookNotFoundException(book_id);
      }
    } catch (err) {
      this.logger.error(err);
      if (err instanceof HttpException) {
        throw err;
      }
      throw new ApiInternalServerException('Unable to set book rating');
    }
  }

  // ====================================
  // route for getting epub url
  // ====================================
  @Get('/:id/:type/url')
  @UseGuards(AuthGuard('jwt'))
  async getEpubUrl(@Param('id') book_id: number, @Req() req): Promise<ApiReturn> {
    const user: User = req.user as User;
    if (!user) {
      throw new ApiUnauthorizedException('User is not authenticated');
    }

    const token = this._usersService.createTemporaryToken(user);

    const ret: ApiReturn = {};
    ret.id_token = token;
    return ret;
  }

  @Get(':id/send/kindle')
  @UseGuards(AuthGuard('jwt'))
  async sendKindle(@Param('id') book_id: number, @Query('mail') mail: string, @Req() req): Promise<ApiReturn> {
    const format = 'EPUB'; // Only epub can be send to kindle now
    try {
      const user: User = req.user as User;
      if (!user) {
        throw new ApiUnauthorizedException('User is not authenticated');
      }
      if (!mail || !book_id) {
        throw new ApiBadRequestException('Mail and book id are required');
      }
      const book = await this._calibreDb.getBookPaths(book_id);
      let fullPath = null;

      if (book && book.book_path && book.data) {
        const data = book.data.filter((bd: BookData) => {
          return bd.data_format == format.toUpperCase();
        });
        if (data && data.length != 0) {
          fullPath = path.resolve(`${CalibreDb1Service.CALIBRE_DIR}/${book.book_path}/${data[0].data_name}.${format.toLowerCase()}`);
          const stats = await fsPromises.stat(fullPath);
          if (stats) {
            await this._usersService.addDownloadedBook(user, book_id, data[0]);
            await this._mailService.sendMail(mail, 'My books', 'This book was sent to you by myCalibre.', `${data[0].data_name}.${format.toLowerCase()}`, `${fullPath}`);
            return { ok: 'Book sent' };
          } else {
            throw new BookNotFoundException(book_id);
          }
        } else {
          throw new BookNotFoundException(book_id);
        }
      } else {
        throw new BookNotFoundException(book_id);
      }
    } catch (err) {
      if (err && err.code === 'ENOENT') {
        throw new BookNotFoundException(book_id);
      }

      this.logger.error(err);
      if (err instanceof HttpException) {
        throw err;
      }
      throw new ApiInternalServerException('Unable to send book to Kindle');
    }
  }
}
