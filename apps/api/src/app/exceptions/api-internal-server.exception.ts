import { InternalServerErrorException } from '@nestjs/common';
import { ApiErrorCode } from './api-error-code.enum';

export class ApiInternalServerException extends InternalServerErrorException {
  constructor(message = 'Internal server error') {
    super({
      message,
      errorCode: ApiErrorCode.INTERNAL_ERROR,
    });
  }
}
