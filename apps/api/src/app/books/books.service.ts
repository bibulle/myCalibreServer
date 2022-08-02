import { Book, BookData, BookPath } from '@my-calibre-server/api-interfaces';
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

@Injectable()
export class BooksService {
  private static readonly logger = new Logger(BooksService.name);

  private static readonly CRON_THUMBNAIL_RECURRING_DEFAULT = CronExpression.EVERY_MINUTE; //EVERY_10_MINUTES;
  private static cronThumbnailRecurrent = BooksService.CRON_THUMBNAIL_RECURRING_DEFAULT;

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
      await this.calculateMissingBookThumbnail();
      await this.calculateMissingSerieThumbnail();
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

  async getBookToDownload(token: string, book_id: number, res: Response, format: 'EPUB' | 'MOBI', contentType: 'application/epub+zip' | 'application/x-mobipocket-ebook') {
    return new Promise<StreamableFile>((resolve) => {
      if (!token) {
        throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
      }

      this._usersService
        .checkToken(token)
        .then((user) => {
          if (!user) {
            throw new HttpException('Not Authorized', HttpStatus.UNAUTHORIZED);
          }

          this._calibreDbService
            .getBookPaths(book_id)
            .then((book: BookPath) => {
              let fullPath = null;

              if (book && book.book_path && book.data) {
                const data = book.data.filter((bd: BookData) => {
                  return bd.data_format == format;
                });
                if (data && data.length != 0) {
                  fullPath = path.resolve(`${CalibreDb1Service.CALIBRE_DIR}/${book.book_path}/${data[0].data_name}.${format.toLowerCase()}`);
                  fsPromises
                    .stat(fullPath)
                    .then(async () => {
                      await this._usersService.addDownloadedBook(user, book_id, data[0]);
                      res.set({
                        'Content-Type': contentType,
                        'Thumbnail-control': 'public, max-age=31536000',
                        'Content-Disposition': `attachment; filename="${data[0].data_name}.${format.toLowerCase()}"`,
                      });
                      resolve(new StreamableFile(createReadStream(fullPath)));
                    })
                    .catch((reason) => {
                      BooksService.logger.error(`${reason}`);
                      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
                    });
                } else {
                  throw new HttpException('Not found', HttpStatus.NOT_FOUND);
                }
              } else {
                throw new HttpException('Not found', HttpStatus.NOT_FOUND);
              }
            })
            .catch((err) => {
              BooksService.logger.error(err);
              throw new HttpException('Not found', HttpStatus.NOT_FOUND);
            });
        })
        .catch((err) => {
          BooksService.logger.error(err);
          throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });
  }

  calculateMissingBookThumbnail(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._calibreDbService
        .getBooks()
        .then(async (books) => {
          for (const book of  books.filter((b) => b.book_has_cover)) {
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
            };
          process.nextTick(resolve);
        })
        .catch((reason) => {
          BooksService.logger.error(reason);
          reject(reason);
        });
    });
  }

  calculateMissingSerieThumbnail(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._calibreDbService
        .getAllSeries()
        .then(async (seriesLst) => {
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
              };

              if (calculation.theBuffer) {
                mkdirSync(path.dirname(thumbnailPath), { recursive: true });

                BooksService.logger.debug(`calculate series thumbnail [end]  : ${series.series_name} (${series.books.length} books)`);
                await this.saveSeriesThumbnail(calculation.theBuffer, thumbnailPath).catch((reason) => {
                  BooksService.logger.error('Error while saving series');
                  BooksService.logger.error(reason);
                });
              }
            }
          };

          process.nextTick(resolve);
        })
        .catch((reason) => {
          BooksService.logger.error(reason);
          reject(reason);
        });
    });
  }

  resizeImage(srcPath: string, trgPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      sharp(srcPath)
        .resize(null, 160)
        .toFile(trgPath, (err) => {
          if (err) {
            BooksService.logger.error(err);
            reject(err);
          } else {
            // BooksService.logger.debug(info);
            process.nextTick(resolve);
          }
        });
    });
  }

  resizeSeries(srcPath: string, calculation: SeriesThumbnailCalculation): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!calculation.theBuffer) {
        // first cover, just copy it
        sharp(srcPath)
          .resize({
            height: calculation.height,
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .toFormat(sharp.format.png)
          .toBuffer((err, buffer, info) => {
            if (err) {
              reject(err);
            } else {
              calculation.width = info.width;
              calculation.theBuffer = buffer;

              resolve();
            }
          });
      } else {
        // no first cover, copy it shifted
        sharp(srcPath)
          .resize({
            height: calculation.height,
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .toFormat(sharp.format.png)
          .toBuffer((err, buffer, info) => {
            if (err) {
              return reject(err);
            }
            sharp(calculation.theBuffer)
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
              .toBuffer((err, buffer, info) => {
                if (err) {
                  reject(err);
                } else {
                  if (info.height > 10 * SeriesThumbnailCalculation.INITIAL_HEIGHT) {
                    //debug("height to big, resize " + info.height + " " + height);
                    calculation.height = Math.round(calculation.height / 10);
                    calculation.step = Math.round(calculation.step / 10);
                    calculation.step = calculation.step + (calculation.step % 2);
                    calculation.step_increment = Math.ceil(calculation.step_increment / 10);
                    calculation.step_increment = calculation.step_increment + (calculation.step_increment % 2);
                    //debug("     "+height+" "+step);

                    sharp(buffer)
                      .resize(null, calculation.height)
                      .toBuffer((err, buffer, info) => {
                        if (err) {
                          reject(err);
                        } else {
                          //debug(info);
                          calculation.width = info.width;
                          calculation.theBuffer = buffer;
                          resolve();
                        }
                      });
                  } else {
                    calculation.width = info.width;
                    calculation.theBuffer = buffer;
                    resolve();
                  }
                }
              });
          });
      }
    });
  }

  saveSeriesThumbnail(theBuffer: Buffer, trgPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      sharp(theBuffer)
        .toFormat(sharp.format.png)
        .toFile(trgPath, (err) => {
          if (err) {
            BooksService.logger.error(err);
            reject(err);
          } else {
            //debug(thumbnailPath + " done");
            process.nextTick(resolve);
            //debug(info);
          }
        });
    });
  }
}

class SeriesThumbnailCalculation {
  static INITIAL_HEIGHT = 160;
  static INITIAL_STEP_INCREMENT = 10;
  theBuffer: Buffer;
  width: number;
  height: number;
  step_increment: number;
  step: number;
}
