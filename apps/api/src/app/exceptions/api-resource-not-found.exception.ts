import { NotFoundException } from '@nestjs/common';
import { ApiErrorCode } from './api-error-code.enum';

export class ApiResourceNotFoundException extends NotFoundException {
  constructor(message = 'Resource not found') {
    super({
      message,
      errorCode: ApiErrorCode.RESOURCE_NOT_FOUND,
    });
  }
}
