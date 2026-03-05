import { Book, BookData, BookPath, Sprite, ThumbnailUtils } from '@my-calibre-server/api-interfaces';
import { HttpException, HttpStatus, Injectable, Logger, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { createReadStream, promises as fsPromises, mkdirSync, statSync, existsSync } from 'fs';
import { CalibreDb1Service } from '../database/calibre-db1.service';
import { UsersService } from '../users/users.service';
import _ = require('lodash');
import path = require('path');
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';
import { CronJob } from 'cron';
import * as sharp from 'sharp';
import { SeriesService } from '../series/series.service';
import { OutputInfo, OverlayOptions } from 'sharp';
import { dirname } from 'path';

@Injectable()
export class BooksService {
  private static readonly logger = new Logger(BooksService.name);

  private static readonly CRON_THUMBNAIL_RECURRING_DEFAULT = CronExpression.EVERY_MINUTE; //EVERY_10_MINUTES EVERY_MINUTE
  private static cronThumbnailRecurrent = BooksService.CRON_THUMBNAIL_RECURRING_DEFAULT;

  private static jobAlreadyRunning = false;

  constructor(
    private readonly _configService: ConfigService,
    private _calibreDbService: CalibreDb1Service,
    private _usersService: UsersService,
    private readonly _schedulerRegistry: SchedulerRegistry,
    private readonly _seriesService: SeriesService
  ) {
    BooksService.cronThumbnailRecurrent = this._configService.get('CRON_Thumbnail_RECURRING', BooksService.CRON_THUMBNAIL_RECURRING_DEFAULT);
    BooksService.logger.debug(`cronThumbnailRecurrent   : ${BooksService.cronThumbnailRecurrent}`);

    const job1 = new CronJob(BooksService.cronThumbnailRecurrent, async () => {
      if (BooksService.jobAlreadyRunning) {
        return;
      }
      try {
        BooksService.jobAlreadyRunning = true;
        if (!existsSync(CacheService.ERR_COVER_THUMBNAIL)) {
          await this.resizeImage(CacheService.ERR_COVER, CacheService.ERR_COVER_THUMBNAIL);
        }
        await this.calculateMissingBookThumbnail();
        await this.calculateMissingSeriesThumbnail();
        await this.calculateSpritesBookThumbnail();
        await this._seriesService.calculateSpritesSeriesThumbnail();
      } catch (error) {
        BooksService.logger.error(error);
      } finally {
        BooksService.jobAlreadyRunning = false;
      }
    });
    this._schedulerRegistry.addCronJob('cronThumbnailRecurrent', job1);
    job1.start();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static createBook(options: any): Book {
    const book = new Book();
    _.merge(book, options);

    ['data_id', 'data_format', 'data_size', 'data_name', 'tag_id', 'tag_name', 'author_sort', 'author_id', 'author_name'].forEach((name) => {
      this.splitAttribute(book, name);
    });
    ['book_date', 'timestamp', 'last_modified'].forEach((name) => {
      book[name] = new Date(book[name]);
    });

    this.createBookData(book);

    if (!book.history) {
      book.history = {
        ratings: [],
        downloads: [],
      };
    }
    if (!book.history.ratings) {
      book.history.ratings = [];
    }
    if (!book.history.downloads) {
      book.history.downloads = [];
    }

    return book;
  }

  /**
   * Create new abject and delete unused attribute
   * @param book
   */
  static createBookData(book: BookPath | Book) {
    book.data = [];
    book['data_id'].forEach((id, index) => {
      book.data.push(
        new BookData({
          data_id: id,
          data_format: book['data_format'][index],
          data_size: book['data_size'][index],
          data_name: book['data_name'][index],
        })
      );
    });

    delete book['data_id'];
    delete book['data_format'];
    delete book['data_size'];
    delete book['data_name'];
  }

  /**
   * Split an attribute separate by pipe to an array
   * @param row
   * @param name
   */
  static splitAttribute(row, name) {
    if (row[name] && row[name].length > 0) {
      // BooksService.logger.debug(`${name} '${row[name]}' ${row[name].length}`)
      // BooksService.logger.debug(`      -> ${row[name].split('|')}`)
      row[name] = row[name].split('|');
    } else {
      row[name] = [];
    }
  }

  getCoverPath(book: BookPath) {
    return path.resolve(`${CalibreDb1Service.CALIBRE_DIR}/${book.book_path}/cover.jpg`);
  }

  getThumbnailPath(book: BookPath) {
    return path.resolve(`${CacheService.THUMBNAIL_DIR}/${book.book_path}/thumbnail.jpg`);
  }

  getSpritesPath(index: number) {
    const indexStr = index.toString().padStart(6, '0');
    return path.resolve(`${CacheService.SPRITE_DIR}/sprites_${indexStr}.png`);
  }

  async getBookToDownload(token: string, book_id: number, res: Response, format: 'EPUB' | 'MOBI', contentType: 'application/epub+zip' | 'application/x-mobipocket-ebook') {
    try {
      if (!token) {
        throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
      }

      const user = await this._usersService.checkToken(token);
      if (!user) {
        throw new HttpException('Not Authorized', HttpStatus.UNAUTHORIZED);
      }

      try {
        const book: BookPath = await this._calibreDbService.getBookPaths(book_id);
        let fullPath = null;

        if (book && book.book_path && book.data) {
          const data = book.data.filter((bd: BookData) => {
            return bd.data_format == format;
          });
          if (data && data.length != 0) {
            fullPath = path.resolve(`${CalibreDb1Service.CALIBRE_DIR}/${book.book_path}/${data[0].data_name}.${format.toLowerCase()}`);
            try {
              await fsPromises.stat(fullPath);
              await this._usersService.addDownloadedBook(user, book_id, data[0]);

              let filename = data[0].data_name;
              if (book.series_name) {
                filename = `${book.series_name} - ${book.book_series_index} - ${filename}`;
              }
              filename = filename.replace(/[<>:"/\\|?*]/g, '_');

              res.set({
                'Content-Type': contentType,
                'Thumbnail-control': 'public, max-age=31536000',
                'Content-Disposition': `attachment; filename="${filename}.${format.toLowerCase()}"`,
              });
              return new StreamableFile(createReadStream(fullPath));
            } catch (reason) {
              BooksService.logger.error(`${reason}`);
              throw new HttpException('Not found', HttpStatus.NOT_FOUND);
            }
          } else {
            throw new HttpException('Not found', HttpStatus.NOT_FOUND);
          }
        } else {
          throw new HttpException('Not found', HttpStatus.NOT_FOUND);
        }
      } catch (err) {
        BooksService.logger.error(err);
        throw new HttpException('Not found', HttpStatus.NOT_FOUND);
      }
    } catch (err) {
      BooksService.logger.error(err);
      throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async calculateMissingBookThumbnail(): Promise<void> {
    try {
      const books = await this._calibreDbService.getBooks();
      for (const book of books.filter((b) => b.book_has_cover)) {
        const coverPath = this.getCoverPath(book);
        const coverStat = statSync(coverPath, { throwIfNoEntry: false });
        const coverDate = coverStat ? coverStat.mtime : null;

        const thumbnailPath = this.getThumbnailPath(book);
        const thumbnailStat = statSync(thumbnailPath, { throwIfNoEntry: false });
        const thumbnailDate = thumbnailStat ? thumbnailStat.mtime : new Date(0);

        if (coverDate && coverDate.getTime() >= thumbnailDate.getTime()) {
          BooksService.logger.debug(`Calculate thumbnail : ${book.book_title}`);
          // BooksService.logger.debug(`${coverDate} ${coverPath}`);
          // BooksService.logger.debug(`${thumbnailDate} ${thumbnailPath}`);

          mkdirSync(path.dirname(thumbnailPath), { recursive: true });

          await this.resizeImage(coverPath, thumbnailPath);
        }
      }
    } catch (error) {
      BooksService.logger.error(error);
      throw error;
    }
  }

  async calculateMissingSeriesThumbnail(): Promise<void> {
    try {
      const seriesLst = await this._calibreDbService.getAllSeries();
      for (const series of seriesLst) {
        const thumbnailPath = this._seriesService.getThumbnailPath(series.series_id);
        const thumbnailStat = statSync(thumbnailPath, { throwIfNoEntry: false });
        const thumbnailDate = thumbnailStat ? thumbnailStat.mtime : new Date(1);

        let coversDate = new Date(0);
        series.books.forEach((book) => {
          const coverPath = this.getCoverPath(book);
          const coverStat = statSync(coverPath, { throwIfNoEntry: false });
          coversDate = coverStat && coverStat.mtime.getTime() >= coversDate.getTime() ? coverStat.mtime : coversDate;
        });

        // BooksService.logger.debug(`${coverDate} ${thumbnailDate}`);
        if (coversDate.getTime() > thumbnailDate.getTime()) {
          BooksService.logger.debug(`calculate series thumbnail [start]: ${series.series_name} (${series.books.length} books)`);

          const calculation: SeriesThumbnailCalculation = {
            theBuffer: undefined,
            width: 0,
            height: SeriesThumbnailCalculation.INITIAL_HEIGHT,
            step_increment: SeriesThumbnailCalculation.INITIAL_STEP_INCREMENT,
            step: -1 * SeriesThumbnailCalculation.INITIAL_STEP_INCREMENT,
          };

          for (const book of series.books) {
            calculation.step += calculation.step_increment;
            calculation.height += calculation.step;

            if (existsSync(this.getCoverPath(book))) {
              await this.resizeSeries(this.getCoverPath(book), calculation).catch((reason) => {
                BooksService.logger.error('Error while resizing series');
                BooksService.logger.error(reason);
              });
            }
          }

          if (calculation.theBuffer) {
            mkdirSync(path.dirname(thumbnailPath), { recursive: true });

            BooksService.logger.debug(`calculate series thumbnail [end]  : ${series.series_name} (${series.books.length} books)`);
            await this.saveBufferToPng(calculation.theBuffer, thumbnailPath).catch((reason) => {
              BooksService.logger.error('Error while saving series');
              BooksService.logger.error(reason);
            });
          }
        }
      }
    } catch (error) {
      BooksService.logger.error(error);
      throw error;
    }
  }

  async calculateSpritesBookThumbnail(): Promise<void> {
    // BooksService.logger.debug('calculateSpritesBookThumbnail()');

    try {
      // const spriteList = {};
      const books = await this._calibreDbService.getBooks();
      const spriteList: Sprite[] = [
        ...new Set<Sprite>(
          books
            .map((b) => {
              return { id: ThumbnailUtils.getSpritesIndex(b.book_id), spriteTime: this.getSpriteDate(b), thumbnailTime: this.getThumbnailDate(b) };
            })
            .reduce((accumulator, current) => {
              const found = accumulator.find((s) => s.id === current.id);
              if (found) {
                found.thumbnailTime = current.thumbnailTime > found.thumbnailTime ? current.thumbnailTime : found.thumbnailTime;
              } else {
                accumulator.push(current);
              }
              return accumulator;
            }, [] as Sprite[])
            .filter((s) => s.thumbnailTime >= s.spriteTime)
        ),
      ].sort((s1, s2) => s1.id - s2.id);
      // BooksService.logger.debug(spriteList);

      for (const i of spriteList) {
        BooksService.logger.debug(`sprite ${i.id} start`);

        await this.createSpritesBooks(i.id);

        BooksService.logger.debug(`sprite ${i.id} done`);
      }

      // BooksService.logger.debug('calculateSpritesBookThumbnail done');
    } catch (error) {
      BooksService.logger.error(error);
      throw error;
    }
  }

  async resizeImage(srcPath: string, trgPath: string): Promise<void> {
    try {
      mkdirSync(dirname(trgPath), { recursive: true });
      await sharp(srcPath).resize(null, ThumbnailUtils.THUMBNAIL_HEIGHT).toFile(trgPath);
      // BooksService.logger.debug(info);
    } catch (error) {
      BooksService.logger.error(error);
      throw error;
    }
  }

  async resizeSeries(srcPath: string, calculation: SeriesThumbnailCalculation): Promise<void> {
    try {
      if (!calculation.theBuffer) {
        // first cover, just copy it
        const { data, info } = await sharp(srcPath)
          .resize({
            height: calculation.height,
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .toFormat(sharp.format.png)
          .toBuffer({ resolveWithObject: true });

        calculation.width = info.width;
        calculation.theBuffer = data;
      } else {
        // no first cover, copy it shifted
        const { data: buffer, info } = await sharp(srcPath)
          .resize({
            height: calculation.height,
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .toFormat(sharp.format.png)
          .toBuffer({ resolveWithObject: true });

        const { data: compositeBuffer, info: compositeInfo } = await sharp(calculation.theBuffer)
          .extend({
            top: calculation.step / 2,
            bottom: calculation.step / 2,
            left: 0,
            right: Math.max(0, calculation.step + info.width - calculation.width),
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .composite([
            {
              input: buffer,
              blend: 'overlay',
              top: 0,
              left: calculation.step,
            },
          ])
          .toBuffer({ resolveWithObject: true });

        if (compositeInfo.height > 10 * SeriesThumbnailCalculation.INITIAL_HEIGHT) {
          //debug("height to big, resize " + info.height + " " + height);
          calculation.height = Math.round(calculation.height / 10);
          calculation.step = Math.round(calculation.step / 10);
          calculation.step = calculation.step + (calculation.step % 2);
          calculation.step_increment = Math.ceil(calculation.step_increment / 10);
          calculation.step_increment = calculation.step_increment + (calculation.step_increment % 2);
          //debug("     "+height+" "+step);

          const { data: resizedBuffer, info: resizedInfo } = await sharp(compositeBuffer).resize(null, calculation.height).toBuffer({ resolveWithObject: true });

          //debug(info);
          calculation.width = resizedInfo.width;
          calculation.theBuffer = resizedBuffer;
        } else {
          calculation.width = compositeInfo.width;
          calculation.theBuffer = compositeBuffer;
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async saveBufferToPng(theBuffer: Buffer, trgPath: string): Promise<void> {
    try {
      await sharp(theBuffer).resize(null, ThumbnailUtils.THUMBNAIL_HEIGHT).toFormat(sharp.format.png).toFile(trgPath);
      //debug(thumbnailPath + " done");
      //debug(info);
    } catch (error) {
      BooksService.logger.error(error);
      throw error;
    }
  }

  static maxWidth = 0;
  static async getThumbnailInfo(path: string): Promise<OutputInfo> {
    try {
      const { data, info } = await sharp(path).resize(null, ThumbnailUtils.THUMBNAIL_HEIGHT).toFormat(sharp.format.png).toBuffer({ resolveWithObject: true });

      if (info.width > this.maxWidth) {
        this.maxWidth = info.width;
        // BooksService.logger.debug(`${path} : ${this.maxWidth}`);
      }
      if (info.width > ThumbnailUtils.THUMBNAIL_HEIGHT) {
        BooksService.logger.warn(`TOO BIG ${path} : ${info.width}`);
      }

      return info;
    } catch (error) {
      throw error;
    }
  }

  getSpriteDate(book: Book): number {
    const spriteId = ThumbnailUtils.getSpritesIndex(book.book_id);
    const spritePath = this.getSpritesPath(spriteId);
    const stat = statSync(spritePath, { throwIfNoEntry: false });
    return stat ? stat.mtimeMs : 0;
  }
  getThumbnailDate(book: Book): number {
    const thumbnailPath = this.getThumbnailPath(book);
    const stat = statSync(thumbnailPath, { throwIfNoEntry: false });
    return stat ? stat.mtimeMs : 0;
  }

  async createSpritesBooks(index: number): Promise<void> {
    try {
      mkdirSync(dirname(this.getSpritesPath(index)), { recursive: true });
      const overlay = await this.getSpritesBooksOverlay(index);
      // create empty image (and add overlay)
      const buffer = await sharp({
        create: { width: ThumbnailUtils.SPRITES_SIZE * ThumbnailUtils.THUMBNAIL_HEIGHT, height: ThumbnailUtils.THUMBNAIL_HEIGHT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      })
        .composite(overlay)
        .png({ palette: true, compressionLevel: 9 })
        .toBuffer();

      await sharp(buffer).toFile(this.getSpritesPath(index));
      // BooksService.logger.debug(info);
    } catch (error) {
      BooksService.logger.error(error);
      throw error;
    }
  }

  async getSpritesBooksOverlay(index: number): Promise<OverlayOptions[]> {
    try {
      const err_info = await BooksService.getThumbnailInfo(CacheService.ERR_COVER_THUMBNAIL);
      const books = await this._calibreDbService.getBooks();
      const overlay: Promise<OverlayOptions>[] = books
        .filter((b) => ThumbnailUtils.getSpritesIndex(b.book_id) === index)
        .map(async (b) => {
          let info = err_info;
          let path = CacheService.ERR_COVER_THUMBNAIL;
          if (existsSync(this.getThumbnailPath(b))) {
            path = this.getThumbnailPath(b);
            const my_info = await BooksService.getThumbnailInfo(path).catch((err) => {
              BooksService.logger.debug(err);
            });
            if (my_info) {
              info = my_info;
            }
            // BooksService.logger.debug(path);
          }
          return {
            input: path,
            top: 0,
            left: ThumbnailUtils.THUMBNAIL_HEIGHT * ThumbnailUtils.getIndexInSprites(b.book_id) + Math.round((ThumbnailUtils.THUMBNAIL_HEIGHT - info.width) / 2),
          };
        });
      return await Promise.all(overlay);
    } catch (error) {
      throw error;
    }
  }
}

class SeriesThumbnailCalculation {
  static INITIAL_HEIGHT = ThumbnailUtils.THUMBNAIL_HEIGHT;
  static INITIAL_STEP_INCREMENT = 10;
  theBuffer: Buffer;
  width: number;
  height: number;
  step_increment: number;
  step: number;
}
