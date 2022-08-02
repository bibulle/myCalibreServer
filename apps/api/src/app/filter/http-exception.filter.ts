import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  readonly logger = new Logger(HttpException.name);

  constructor() {
    this.logger.warn('HttpExceptionFilter');
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const message = request['authInfo'] || exception.message;
    this.logger.warn(`statusCode:${status} path:'${request.url}'`);
    // this.logger.debug(JSON.stringify(request['authInfo']))

    response.status(status).json({
      statusCode: status,
      name: exception.name,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
