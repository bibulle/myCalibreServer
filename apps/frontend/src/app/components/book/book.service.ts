import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiReturn, Book, ReaderRatingTotal, User } from '@my-calibre-server/api-interfaces';

@Injectable()
export class BookService {
  private static booksList: Book[];

  private booksUrl = '/api/book';
  private sendKindleUrl = '/send/kindle';
  private updateRatingUrl = '/rating/';
  private getEpubURL = '/epub/url';
  private getMobibURL = '/mobi/url';

  constructor(private httpClient: HttpClient) {}

  /**
   * get the books list
   */
  getBooks(): Promise<Book[]> {
    return new Promise<Book[]>((resolve, reject) => {
      this.httpClient
        .get<ApiReturn>(this.booksUrl)
        // .map((res: Response) => res.json().data as Book[])
        .subscribe({
          next: (data) => {
            if (data && data.books) {
              BookService.booksList = data.books.map((book) => {
                if (typeof book.book_date === 'string') {
                  book.book_date = new Date(book.book_date);
                }
                return book;
              });
              resolve(BookService.booksList);
            } else {
              console.error(data);
              reject('Cannot read books');
            }
          },
          error: (err) => {
            reject(err);
          },
        });
    });
  }

  /**
   * get the new books list
   */
  getNewBooks(): Promise<Book[]> {
    return new Promise<Book[]>((resolve, reject) => {
      this.httpClient
        .get<ApiReturn>(this.booksUrl + '/new')
        // .map((res: Response) => res.json().data as Book[])
        .subscribe({
          next: (data) => {
            if (data && data.books) {
              resolve(
                data.books.map((book) => {
                  if (typeof book.book_date === 'string') {
                    book.book_date = new Date(book.book_date);
                  }
                  return book;
                })
              );
            } else {
              console.error(data);
              reject('Cannot read books');
            }
          },
          error: (err) => {
            reject(err);
          },
        });
    });
  }

  /**
   * get a book
   */
  getBook(book_id: string): Promise<Book> {
    return new Promise<Book>((resolve, reject) => {
      this.httpClient
        .get<ApiReturn>(this.booksUrl + '/' + book_id)
        // .map((res: Response) => res.json().data as Book[])
        .subscribe({
          next: (data) => {
            if (data && data.book) {
              if (typeof data.book.book_date === 'string') {
                data.book.book_date = new Date(data.book.book_date);
              }
              resolve(data.book);
            } else {
              console.error(data);
              reject('Cannot read book');
            }
          },
          error: (err) => {
            reject(err);
          },
        });
    });
  }

  cloneBook(src: Book): Book {
    const trg: Book = {
      book_id: src.book_id,
      book_title: src.book_title,
      book_sort: src.book_title,
      book_has_cover: src.book_has_cover,
      book_path: src.book_path,
      book_series_index: src.book_series_index,
      author_id: src.author_id.map((v) => v),
      author_name: src.author_name.map((v) => v),
      author_sort: src.author_sort.map((v) => v),
      tag_id: src.tag_id ? src.tag_id.map((v) => v) : [],
      tag_name: src.tag_name ? src.tag_name.map((v) => v) : [],
      lang_id: src.lang_id,
      lang_code: src.lang_code,
      series_id: src.series_id,
      rating: src.rating,
      series_name: src.series_name,
      series_sort: src.series_sort,
      comment: src.comment,
      book_date: src.book_date,
      timestamp: src.timestamp,
      last_modified: src.last_modified,
      data: src.data ? src.data.map((v) => v) : [],
      history: {
        ratings: src.history.ratings.map((v) => v),
        downloads: src.history.downloads.map((v) => v),
      },
      readerRating: src.readerRating,
      readerRatingCount: src.readerRatingCount,
    };
    return trg;
  }

  /**
   * send vote to backend
   * @param {number} book_id
   * @param {number} rating
   * @returns {Promise<void>}
   */
  updateRating(book_id: number, rating: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const body = JSON.stringify({ rating: rating });

      this.httpClient
        .post<ApiReturn>(this.booksUrl + '/' + book_id + this.updateRatingUrl, body, {
          headers: new HttpHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }),
        })
        .subscribe({
          next: (data) => {
            if (data && data.ok) {
              resolve(data.ok);
            } else {
              console.error(data);
              reject('Cannot update rating');
            }
          },
          error: (error) => {
            reject(error);
          },
        });
    });
  }

  /**
   * send mail with kindle
   * @param {number} book_id
   * @param {string} email
   * @returns {Promise<void>}
   */
  sendKindle(book_id: number, email: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.httpClient
        .get<ApiReturn>(this.booksUrl + '/' + book_id + this.sendKindleUrl + '?mail=' + email) //
        .subscribe({
          next: () => {
            resolve();
          },
          error: (err) => {
            reject(err);
          },
        });
    });
  }

  /**
   * Get URL with temporary token
   * @param {number} book_id
   * @returns {Promise<string>}
   */
  getEpubUrl(book_id: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.httpClient
        .get<ApiReturn>(this.booksUrl + '/' + book_id + this.getEpubURL) //
        .subscribe({
          next: (data) => {
            if (data && data.id_token) {
              resolve(this.booksUrl + '/' + book_id + '/epub?token=' + data.id_token);
            } else {
              console.error(data);
              reject('Cannot get epub url');
            }
          },
          error: (err) => {
            reject(err);
          },
        });
    });
  }

  /**
   * Get URL with temporary token
   * @param {number} book_id
   * @returns {Promise<string>}
   */
  getMobiUrl(book_id: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.httpClient
        .get<ApiReturn>(this.booksUrl + '/' + book_id + this.getMobibURL) //
        .subscribe({
          next: (data) => {
            if (data && data.id_token) {
              resolve(this.booksUrl + '/' + book_id + '/mobi?token=' + data.id_token);
            } else {
              console.error(data);
              reject('Cannot get mobi url');
            }
          },
          error: (err) => {
            reject(err);
          },
        });
    });
  }

  updateReaderRating(book: Book, user: User): ReaderRatingTotal {
    const result: ReaderRatingTotal = {
      rating: 0,
      count: 0,
      yourRating: 0,
    };

    let bookReaderRatingSum = 0;
    book.history.ratings.forEach((r) => {
      bookReaderRatingSum += r.rating;
      result.count++;
      if (r.user_id === user.id) {
        result.yourRating = r.rating;
      }
    });

    // console.log(user.history.ratings);
    if (user.history.ratings) {
      user.history.ratings
        .filter((r) => {
          return +r.book_id === +book.book_id;
        })
        .forEach((r) => {
          // we found this book if the users votes ... use it (and add it if it's not in the book already)
          if (result.yourRating) {
            bookReaderRatingSum -= result.yourRating;
            result.count--;
          }
          if (r.rating) {
            result.yourRating = r.rating;
            bookReaderRatingSum += result.yourRating;
            result.count++;
          }
        });
    }

    result.rating = bookReaderRatingSum / Math.max(result.count, 1);

    return result;
  }
}
