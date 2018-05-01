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

const CRON_TAB_GET_INFO = '0 */2  * * * *';
debug("CronTab          : '" + CRON_TAB_GET_INFO + "'");

function getInfo () {

  async.waterfall([
      (callback1) => {
        // =================
        // Get Books list
        // =================
        DbCalibre
          .getInstance()
          .getBooks()
          .then((books: Book[]) => {

            // only get one with no note
            let resultBooks = books.filter(book => {
              return book.rating == null;
            });

            debug(resultBooks.length+" books have no note");
            shuffle(resultBooks);

            callback1(null, resultBooks[0])
          })
          .catch(err => {
            debug("ERROR getBooks !!");
            debug(err);
            callback1(err);
          })
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
        //debug(URL);

        request(URL, (error, response, body) => {
            if (error) {
              return callback1(error);
            }
            // debug(response);
            // debug(body);

            let $ = cheerio.load(body);

            let title = $('.s-access-title').first().text();
            // debug(title)

            // debug("---------1")
            // debug($('.a-col-right .a-spacing-none').next().html());
            // debug("---------2")
            // debug($('.a-col-right .a-spacing-none').first().next().children().text());
            // debug("---------3");
            // debug($('.a-col-right .a-spacing-none').next().find('span a').html());
            // debug("---------4");

            //let author = $('.a-col-right .a-spacing-none').next().find('span a').html();
            //if (!author) {
            let author = $('.a-col-right .a-spacing-none').first().next().children().text();
            //}
            // debug(author);
            let authorReversed = author.split(' ').reverse().join(' ');
            // debug(authorReversed);

            let titleOK = title.toLowerCase().indexOf(book.book_title.toLowerCase()) >= 0;
            let authorOK = author.toLowerCase().indexOf(book.author_name[0].toLowerCase()) >= 0;
            authorOK = authorOK || authorReversed.toLowerCase().indexOf(book.author_name[0].toLowerCase()) >= 0;

            if (titleOK && authorOK) {
              let note = $('.a-icon-star span').first().text();
              if (note) {
                note = note.split(' ')[0].replace(',', '.') * 2;
                debug('Note : ' + note + ' (' + book.book_title + ' - ' + book.author_name[0] + ')');
                callback1(null, book, note);
              } else {
                callback1("Note not found : " + book.book_title + ' (' + book.author_name[0] + ')');
              }


            } else {
              callback1("Book not found : " + book.book_title + ' (' + book.author_name[0] + ')');
            }
          }
        )
        //debug(URL);

      },
      (book, note, callback1) => {
        // =================
        // Get Ratings list
        // =================
        DbCalibre
          .getInstance()
          .getRatings()
          .then((ratings: BookRating[]) => {

            let filterRatings = ratings.filter(bookRating => {
              return bookRating.rating === Math.round(note)
            });

            if (filterRatings.length == 0) {

              let ratingsId: number[] = ratings.map(bookRating => {
                return bookRating.id;
              });
              // Found a free id
              let id = 1;
              while (ratingsId.indexOf(id) >= 0) {
                id++;
              }

              let bookRating = new BookRating({
                id: id,
                rating: Math.round(note)
              });

              DbCalibre
                .getInstance()
                .insertRating(bookRating)
                .then(br => {
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
                debug("Updated : "+book.book_title + ' (' + book.author_name[0] + ')');
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
        debug("ERROR: " + err);
      }
      //debug('Done.');
    });
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
