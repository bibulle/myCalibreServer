import {User} from '../authent/user';

export class Book {

  book_id: number;
  book_title: string;
  book_sort: string;
  author_sort: string;
  book_has_cover: string;
  // noinspection JSUnusedGlobalSymbols
  book_path: string;
  book_series_index: number;
  author_id: number[];
  author_name: string[];
  tag_id: number[];
  tag_name: string[];
  lang_id: number;
  lang_code: string;
  series_id: string;
  rating: string;
  series_name: string;
  series_sort: string;
  comment: string;
  book_date: string;

  data: BookData[];

  history: {
    ratings: ReaderRating[],
    downloads: Downloader[]
  };

  readerRating: number;
  readerRatingCount: number;



  static updateReaderRating(book: Book, user: User): ReaderRatingTotal {

    let result: ReaderRatingTotal = {
      rating: 0,
      count: 0,
      yourRating: 0
    };

    let bookReaderRatingSum = 0;
    if (book.history && book.history.ratings && (book.history.ratings.length !== 0)) {
      for (let i = 0; i < book.history.ratings.length; i++) {
        // console.log(this.history.ratings[i].rating);
        bookReaderRatingSum += book.history.ratings[i].rating;
        result.count++;
        if (book.history.ratings[i].user_id === user.id) {
          result.yourRating = book.history.ratings[i].rating;
        }
      }
    }

    // console.log(user.history.ratings);
    for (let i = 0; i < user.history.ratings.length; i++) {
      if (+user.history.ratings[i].book_id === book.book_id) {
        // we found this book if the users votes ... use it (and add it if it's not in the book already)
        if (result.yourRating) {
          bookReaderRatingSum -= result.yourRating;
          result.count--;
        }

        result.yourRating = user.history.ratings[i].rating;
        bookReaderRatingSum += result.yourRating;
        result.count++;
      }
    }

    result.rating = bookReaderRatingSum / Math.max(result.count, 1);

    return result;
  }


}

export class BookData {
  // noinspection JSUnusedGlobalSymbols
  data_id: number;
  data_format: string;
  // noinspection JSUnusedGlobalSymbols
  data_size: number;
  data_name: string;
}

export class Downloader {
  date: Date;
  // noinspection JSUnusedGlobalSymbols
  data_format: number;
  // noinspection JSUnusedGlobalSymbols
  user_id: string;
  // noinspection JSUnusedGlobalSymbols
  user_name: string;
}

export class ReaderRating {
  date: Date;
  rating: number;
  user_id: string;
  // noinspection JSUnusedGlobalSymbols
  user_name: string;
}

export class ReaderRatingTotal {
  rating: number;
  count: number;
  yourRating: number;
}
