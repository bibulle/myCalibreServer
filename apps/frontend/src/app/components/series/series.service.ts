import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiReturn, Series } from '@my-calibre-server/api-interfaces';

@Injectable()
export class SeriesService {
  constructor(private httpClient: HttpClient) {}

  /**
   * get the books list
   */
  getSeries(): Promise<Series[]> {
    return new Promise<Series[]>((resolve, reject) => {
      this.httpClient.get<ApiReturn>('/api/series').subscribe({
        next: (data: ApiReturn) => {
          if (data && data.series) {
            resolve(data.series.map(serie => {
              serie.books.forEach(book => {
                if (typeof book.book_date === 'string') {
                  book.book_date = new Date(book.book_date);
                }
              });
              return serie;
            }));
          } else {
            console.error(data);
            reject('Cannot read series');
          }
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }
}
