
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
  data_format: number;
  user_id: string;
  user_name: string;
}
export class ReaderRating {
  date: Date;
  rating: number;
  user_id: string;
  user_name: string;
}
