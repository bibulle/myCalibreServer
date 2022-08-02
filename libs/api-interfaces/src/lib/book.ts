export class Book {
  book_id = 0;
  book_title = '';
  book_sort = '';
  book_has_cover = '';
  book_path = '';
  book_series_index = 0;
  author_id: number[] = [];
  author_name: string[] = [];
  author_sort: string[] = [];
  tag_id: number[] = [];
  tag_name: string[] = [];
  lang_id = 0;
  lang_code = '';
  series_id = '';
  rating = '';
  series_name = '';
  series_sort = '';
  comment = '';
  book_date = new Date();
  timestamp = new Date();
  last_modified = new Date();

  data: BookData[] = [];

  history: {
    ratings: ReaderRating[];
    downloads: Downloader[];
  } = {
    ratings: [],
    downloads: [],
  };

  readerRating = 0;
  readerRatingCount = 0;
}

export class BookData {
  data_id = 0;
  data_format = '';
  data_size = 0;
  data_name = '';

  constructor(options: any) {
    this.data_id = options.data_id;
    this.data_format = options.data_format;
    this.data_size = options.data_size;
    this.data_name = options.data_name;
  }
}

export class BookPath {
  book_id = 0;
  book_has_cover = '';
  book_path = '';

  data: BookData[] = [];
}

export class Downloader {
  date: Date | undefined;
  data_format = '';
  user_id = '';
  user_name = '';
}

export class ReaderRating {
  date: Date | undefined;
  rating = 0;
  user_id = '';
  user_name = '';
}

export class ReaderRatingTotal {
  rating = 0;
  count = 0;
  yourRating = 0;
}

export class Tag {
  tag_id = 0;
  tag_name = '';

  books: Book[] = [];
  allBooks?: Book[];
}

export class Series {
  series_id = 0;
  series_name = '';
  series_sort = '';

  author_name: string[] = [];
  author_sort: string[] = [];
  book_date: Date[] = [];

  books: Book[] = [];
  allBooks?: Book[];
}

export class Author {
  author_id = 0;
  author_name = '';
  author_sort = '';

  book_date: Date[] = [];

  books: Book[] = [];
  allBooks?: Book[];
}

export type CacheContent = Book | Series | Author | Tag;
