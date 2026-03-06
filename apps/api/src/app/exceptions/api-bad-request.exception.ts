import { BadRequestException } from '@nestjs/common';
import { ApiErrorCode } from './api-error-code.enum';

export class ApiBadRequestException extends BadRequestException {
  constructor(message = 'Bad request') {
    super({
      message,
      errorCode: ApiErrorCode.BAD_REQUEST,
    });
  }
}
