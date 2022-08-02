import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiReturn, Author } from '@my-calibre-server/api-interfaces';

@Injectable()
export class AuthorService {
  constructor(private httpClient: HttpClient) {}

  /**
   * get the author list
   */
  getAuthors(): Promise<Author[]> {
    return new Promise<Author[]>((resolve, reject) => {
      this.httpClient.get<ApiReturn>('/api/author').subscribe({
        next: (data: ApiReturn) => {
          if (data && data.authors) {
            resolve(data.authors.map(author => {
              author.books.forEach(book => {
                if (typeof book.book_date === 'string') {
                  book.book_date = new Date(book.book_date);
                }
              });
              return author;
            }));
          } else {
            console.error(data);
            reject('Cannot read authors');
          }
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }
}
