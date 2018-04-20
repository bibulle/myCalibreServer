
export class Book {

  book_id: number;
  book_title: string;
  book_sort: string;
  author_sort: string;
  book_has_cover: string;
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

}

export class BookData {
  data_id: number;
  data_format: string;
  data_size: number;
  data_name: string;
}
