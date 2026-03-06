import { ApiResourceNotFoundException } from './api-resource-not-found.exception';

export class BookNotFoundException extends ApiResourceNotFoundException {
  constructor(bookId: number) {
    super(`Book with ID ${bookId} not found`);
  }
}
