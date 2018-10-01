import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {Book} from './book';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Injectable()
export class BookService {

  private static booksList: Book[];

  private booksUrl = environment.serverUrl + 'api/book';
  private sendKindleUrl = '/send/kindle';
  private updateRatingUrl = '/rating/';
  private getEpubURL = '/epub/url';
  private getMobibURL = '/mobi/url';


  constructor(private httpClient: HttpClient) {
  }

  /**
   * get the books list
   */
  getBooks(callback: Function, numPage?: number, maxPage?: number): void {

    numPage = numPage || 1;
    maxPage = maxPage || 1;

    if (numPage <= maxPage) {
      console.log('loading page ' + numPage + ' / ' + maxPage);
      let url = this.booksUrl + (numPage ? '?page_num=' + numPage : '')
      this.httpClient.get(url)
        .subscribe(
          (data: Object) => {
            if (!BookService.booksList || (numPage === 1)) {
              BookService.booksList = [];
            }
            maxPage = data['pageCount'];

            BookService.booksList = BookService.booksList.concat(data['data'] as Book[]);
            console.log('loaded page ' + numPage + ' / ' + maxPage);
            callback(BookService.booksList);
            console.log('displayed page ' + numPage + ' / ' + maxPage);

            setTimeout(() => {
              this.getBooks(callback, numPage + 1, maxPage);
            });
          },
          err => {
            callback(null, err);
          },
        )
    }

    // return new Promise<Book[]>((resolve, reject) => {
    //   let url = this.booksUrl + (numPage ? '?page_num=' + numPage : '')
    //   this.httpClient.get(url)
    //   // .map((res: Response) => res.json().data as Book[])
    //     .subscribe(
    //       (data: Object) => {
    //         BookService.booksList = data['data'] as Book[];
    //         resolve(BookService.booksList);
    //       },
    //       err => {
    //         reject(err);
    //       },
    //     );
    // });
  }

  /**
   * get the new books list
   */
  getNewBooks(): Promise<Book[]> {

    return new Promise<Book[]>((resolve, reject) => {
      this.httpClient.get(this.booksUrl + '/new')
      // .map((res: Response) => res.json().data as Book[])
        .subscribe(
          (data: Object) => {
            resolve(data['data'] as Book[]);
          },
          err => {
            reject(err);
          },
        );
    });
  }

  /**
   * get a book
   */
  getBook(book_id: string): Promise<Book> {
    return new Promise<Book>((resolve, reject) => {
      let book: Book;
      if (BookService.booksList) {
        book = BookService.booksList.find(b => {
          return b.book_id.toString() === book_id
        });
      }

      if (book) {
        resolve(book);
      } else {
        this.getBooks(
          (books, err) => {
            if (err) {
              reject(err);
            } else {
              book = books.find(b => {
                return b.book_id.toString() === book_id
              });
              if (book) {
                resolve(book);
              } else {
                reject('Not found');
              }
            }
          }
        )
      }
    });
  }

  /**
   * send vote to backend
   * @param {number} book_id
   * @param {number} rating
   * @returns {Promise<void>}
   */
  updateRating(book_id: number, rating: number): Promise<string> {

    return new Promise<string>((resolve, reject) => {
      let body = JSON.stringify({rating: rating});

      this.httpClient.post(
        this.booksUrl + '/' + book_id + this.updateRatingUrl,
        body,
        {
          headers: new HttpHeaders({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          })
        })
        .toPromise()
        .then(data => {
          // console.log(data);
          resolve(data['OK']);
        })
        .catch(error => {
          reject(error);
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
      this.httpClient.get(this.booksUrl + '/' + book_id + this.sendKindleUrl + '?mail=' + email)
        .subscribe(
          () => {
            resolve();
          },
          err => {
            reject(err);
          },
        );
    });
  }

  /**
   * Get URL with temporary token
   * @param {number} book_id
   * @returns {Promise<string>}
   */
  getEpubUrl(book_id: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.httpClient.get(this.booksUrl + '/' + book_id + this.getEpubURL)
        .subscribe(
          (data: Object) => {
            resolve(this.booksUrl + '/' + book_id + '.epub?token=' + data['token']);
          },
          err => {
            reject(err);
          },
        );
    });
  }

  /**
   * Get URL with temporary token
   * @param {number} book_id
   * @returns {Promise<string>}
   */
  getMobiUrl(book_id: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.httpClient.get(this.booksUrl + '/' + book_id + this.getMobibURL)
        .subscribe(
          (data: Object) => {
            resolve(this.booksUrl + '/' + book_id + '.mobi?token=' + data['token']);
          },
          err => {
            reject(err);
          },
        );
    });
  }
}
