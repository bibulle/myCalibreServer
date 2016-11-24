import { Injectable } from '@angular/core';
import { environment } from "../../../environments/environment";
import { Book } from "./book";
import { Http, Response } from "@angular/http";

@Injectable()
export class BookService {

  private booksUrl = environment.serverUrl + 'api/book';

  constructor (private http: Http) { }


  /**
   * get the books list
   */
  getBooks (): Promise<Book[]> {

    return new Promise<Book[]>((resolve, reject) => {
      this.http.get(this.booksUrl)
          .map((res: Response) => res.json().data as Book[])
          .subscribe(
            data => {
              resolve(data);
            },
            err => {
              reject(err);
            },
          );
    });
  }
}
