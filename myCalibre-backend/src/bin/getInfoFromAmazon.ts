// https://books.google.com/books/feeds/volumes?start-index=1&max-results=20&q=intitle%3Afsdfs%2Binauthor%3AFlorence+inauthor%3ABraunsteindfsf&min-viewability=none
// https://www.amazon.fr/s/?unfiltered=1&sort=relevancerank&field-title=fsdfs&search-alias=stripbooks&field-author=Florence+Braunsteindfsf

import { Book, BookRating } from "../models/book";
import DbCalibre from "../models/dbCalibre";

const async = require('async');
const request = require('request');
const cheerio = require('cheerio');
const CronJob = require('cron').CronJob;
const debug = require('debug')('server:getInfoFromAmazon');


debug('Starting.....');
process.chdir(`${__dirname}/../..`);

const CRON_TAB_GET_INFO = '0 *  * * * *';
debug("CronTab          : '" + CRON_TAB_GET_INFO + "'");

var booksToChange;

var countNotFoundBook = 0;
var countNotFoundRating = 0;
var countUpdated = 0;
var countInserted = 0;

function getInfo () {

  async.waterfall([
      (callback1) => {
        // =================
        // Get Books list
        // =================
        if (booksToChange) {
          callback1(null, booksToChange)
        } else {
          DbCalibre
            .getInstance()
            .getBooks()
            .then((books: Book[]) => {

              debug("Books loaded");
              // only get one with no rating
              let resultBooks = books.filter(book => {
                return book.rating == null;
              });

              booksToChange = resultBooks;

              callback1(null, booksToChange)
            })
            .catch(err => {
              debug("ERROR getBooks !!");
              debug(err);
              callback1(err);
            })
        }
      },
      (booksToChange, callback1) => {
        // =================
        // Get Books list
        // =================

        debug(booksToChange.length + " books have no rating and have not been try ("+(countUpdated+countInserted)+'/'+(countNotFoundBook+countNotFoundRating+countUpdated+countInserted)+')');

        if (booksToChange.length == 0) {
          return callback1("Done");
        }

        shuffle(booksToChange);

        let book = booksToChange[0];

        booksToChange.splice(0, 1);

        callback1(null, book)
      },
      (book, callback1) => {
        // =================
        // get infos
        // =================
        //debug(books[0]);

        let title = encodeURIComponent(book.book_title);
        let author = encodeURIComponent(book.author_name[0]);

        let URL = `https://www.amazon.fr/s/?unfiltered=1&sort=relevancerank&field-title=${title}&search-alias=stripbooks&field-author=${author}`;
        //let URL = 'https://www.amazon.fr/s/?unfiltered=1&sort=relevancerank&field-title=Le%20Secret%20des%20runes&search-alias=stripbooks&field-author=Michael%20Moorcock'
        debug(URL);

        request(URL, (error, response, body) => {
            if (error) {
              return callback1(error);
            }
            //debug(response);
            //debug(body);

            let $ = cheerio.load(body);

            //let title = $('.s-access-title').first().text();
            let title = $('.s-result-list span.a-size-medium').first().text();

            //debug('title : ' + title)

            // debug("---------1")
            // debug($('.a-col-right .a-spacing-none').next().html());
            // debug("---------2")
            // debug($('.a-col-right .a-spacing-none').first().next().children().text());
            // debug("---------3");
            // debug($('.a-col-right .a-spacing-none').next().find('span a').html());
            // debug("---------4");

            //let author = $('.a-col-right .a-spacing-none').next().find('span a').html();
            //if (!author) {
            let author = $('.s-result-list .sg-col-inner .a-row span.a-size-base').first().next().text().trim();
            //}
            //debug('author : '+author);
            let authorReversed = author.split(' ').reverse().join(' ');
            //debug(authorReversed);

            let titleOK = removeAccent(title).indexOf(removeAccent(book.book_title)) >= 0;
            let authorOK = removeAccent(author).indexOf(removeAccent(book.author_name[0])) >= 0;
            authorOK = authorOK || removeAccent(authorReversed).indexOf(removeAccent(book.author_name[0])) >= 0;

            if (titleOK && authorOK) {
              let rating = $('.a-icon-star-small span').first().text();
              if (rating) {
                rating = rating.split(' ')[0].replace(',', '.') * 2;
                // debug('Rating : ' + rating + ' (' + book.book_title + ' - ' + book.author_name[0] + ')');
                callback1(null, book, rating);
              } else {
                countNotFoundRating++,
                  callback1("Rating not found : " + book.book_title + ' (' + book.author_name[0] + ')');
              }


            } else {
              countNotFoundBook++;
              callback1("Book not found : " + book.book_title + ' (' + book.author_name[0] + ')');
            }
          }
        )
        //debug(URL);

      },
      (book, rating, callback1) => {
        // =================
        // Get Ratings list
        // =================
        DbCalibre
          .getInstance()
          .getRatings()
          .then((ratings: BookRating[]) => {

            let filterRatings = ratings.filter(bookRating => {
              return bookRating.rating === Math.round(rating)
            });

            if (filterRatings.length == 0) {

              let ratingsId: number[] = ratings.map(bookRating => {
                return bookRating['id'];
              });
              // Found a free id
              let id = 1;
              while (ratingsId.indexOf(id) >= 0) {
                id++;
              }

              let bookRating = new BookRating({
                id: id,
                rating: Math.round(rating)
              });

              DbCalibre
                .getInstance()
                .insertRating(bookRating)
                .then(br => {
                  countInserted++;
                  debug("inserted : " + bookRating);
                  callback1(null, book, br);
                })
                .catch(err => {
                  debug("ERROR insertRating !!");
                  debug(err);
                  callback1(err);
                })


            } else {

              // debug(filterRatings[0]);
              callback1(null, book, filterRatings[0]);
            }


          })
          .catch(err => {
            debug("ERROR getBooks !!");
            debug(err);
            callback1(err);
          })
      },
      (book, bookRating, callback1) => {
        // =================
        // First search for free link id
        // =================
        DbCalibre
          .getInstance()
          .getBookRatingLinkIds()
          .then((ids: number[]) => {

            let id = 1;
            while (ids.indexOf(id) >= 0) {
              id++;
            }
            // =================
            // then Insert it
            // =================
            // debug("Going to insert : " + id + " " + book.book_id + " " + bookRating.id);

            DbCalibre
              .getInstance()
              .insertBookRatingLink(id, book.book_id, bookRating.id)
              .then(() => {
                countUpdated++;
                debug("Updated : " + book.book_title + ' (' + book.author_name[0] + ')');
                callback1();
              })
              .catch(err => {
                debug("ERROR getBookRatingLinkIds !!");
                debug(err);
                callback1(err);
              })


          })
          .catch(err => {
            debug("ERROR getBookRatingLinkIds !!");
            debug(err);
            callback1(err);
          })
      }
    ],
    (err) => {
      if (err) {
        debug(err);
        //debug("ERROR: " + err);
      }
      //debug('Done.');
    });
}

function removeAccent(s:string) {
  let ret = s.toLocaleLowerCase();
  ret = ret.replace(/[éèêëęėē]/g, 'e');
  ret = ret.replace(/[àâªæáäãåā]/g, 'a');
  ret = ret.replace(/[ôœºöòóõøō]/g, 'o');
  ret = ret.replace(/[ûùüúū]/g, 'u');
  ret = ret.replace(/[îïìíįī]/g, 'i');
  ret = ret.replace(/[,']/g, '');
  return ret;
}

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle (a) {
  let j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

getInfo();
//========================================================================
new CronJob(CRON_TAB_GET_INFO, getInfo, null, true, "GMT");
//========================================================================
