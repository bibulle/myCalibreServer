import { Injectable } from '@angular/core';
import { environment } from "../../../environments/environment";
import { Book } from "./book";
import { Http, Response } from "@angular/http";

@Injectable()
export class BookService {

  private booksUrl = environment.serverUrl + 'api/book';

  constructor (private http: Http) { }

  private static booksList: Book[];

  /**
   * get the books list
   */
  getBooks (): Promise<Book[]> {

    return new Promise<Book[]>((resolve, reject) => {
      this.http.get(this.booksUrl)
          .map((res: Response) => res.json().data as Book[])
          .subscribe(
            data => {
              BookService.booksList = data;
              resolve(data);
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
  getBook (book_id: number): Promise<Book> {

    return new Promise<Book>((resolve, reject) => {
      var book: Book;
      if (BookService.booksList) {
        book = BookService.booksList.find(b => { return b.book_id == book_id});
      }

      if (book) {
        resolve(book);
      } else {
        this.getBooks()
            .then((books: Book[]) => {
              book = books.find(b => { return b.book_id == book_id});
              if (book) {
                resolve(book);
              } else {
                reject("Not found");
              }

            })
            .catch(err => {
              reject(err);
            });
      }
    });
  }
}
