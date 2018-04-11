import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Book } from './book';
import { Response } from '@angular/http';
import { AuthHttp } from 'angular2-jwt';

@Injectable()
export class BookService {

  private static booksList: Book[];

  private booksUrl = environment.serverUrl + 'api/book';
  private sendKindleUrl = '/send/kindle';


  constructor (private authHttp: AuthHttp) { }

  /**
   * get the books list
   */
  getBooks (): Promise<Book[]> {

    return new Promise<Book[]>((resolve, reject) => {
      this.authHttp.get(this.booksUrl)
          // .map((res: Response) => res.json().data as Book[])
          .subscribe(
            (res: Response) => {
              BookService.booksList = res.json().data as Book[];
              resolve(BookService.booksList);
            },
            err => {
              reject(err);
            },
          );
    });
  }

  /**
   * get the new books list
   */
  getNewBooks (): Promise<Book[]> {

    return new Promise<Book[]>((resolve, reject) => {
      this.authHttp.get(this.booksUrl + '/new')
          // .map((res: Response) => res.json().data as Book[])
          .subscribe(
            (res: Response) => {
              resolve(res.json().data as Book[]);
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
  getBook (book_id: string): Promise<Book> {
    return new Promise<Book>((resolve, reject) => {
      let book: Book;
      if (BookService.booksList) {
        book = BookService.booksList.find(b => { return b.book_id.toString() === book_id});
      }

      if (book) {
        resolve(book);
      } else {
        this.getBooks()
            .then((books: Book[]) => {
              book = books.find(b => { return b.book_id.toString() === book_id});
              if (book) {
                resolve(book);
              } else {
                reject('Not found');
              }

            })
            .catch(err => {
              reject(err);
            });
      }
    });
  }

  /**
   * send mail with kindle
   */
  sendKindle (book_id: number, email: string): Promise<void> {

    return new Promise<void>((resolve, reject) => {
      this.authHttp.get(this.booksUrl + '/' + book_id + this.sendKindleUrl + '?mail=' + email)
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
}
