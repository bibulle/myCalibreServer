import { ApiResourceNotFoundException } from './api-resource-not-found.exception';

export class UserNotFoundException extends ApiResourceNotFoundException {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`);
  }
}
