import { UnauthorizedException } from '@nestjs/common';
import { ApiErrorCode } from './api-error-code.enum';

export class ApiUnauthorizedException extends UnauthorizedException {
  constructor(message = 'Not authorized') {
    super({
      message,
      errorCode: ApiErrorCode.UNAUTHORIZED,
    });
  }
}
