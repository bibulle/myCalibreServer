import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const timestamp = new Date().toISOString();
    const payload = this.buildPayload(exception, request, status, timestamp);

    const logPayload = {
      method: request.method,
      path: request.url,
      statusCode: status,
      ...payload,
    };

    const stack = exception instanceof Error ? exception.stack : undefined;
    this.logger.error(JSON.stringify(logPayload), stack);

    response.status(status).json(payload);
  }

  private buildPayload(exception: unknown, request: Request, status: number, timestamp: string) {
    const path = request.url;
    const authInfo = this.asString(request['authInfo']);
    const name = exception instanceof Error ? exception.name : 'Error';
    const defaultMessage = status === HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal server error' : 'Unexpected error';

    if (!(exception instanceof HttpException)) {
      return {
        statusCode: status,
        name,
        message: authInfo || defaultMessage,
        timestamp,
        path,
      };
    }

    const exceptionResponse = exception.getResponse();
    const responseObject = typeof exceptionResponse === 'object' && exceptionResponse !== null ? exceptionResponse : {};
    const messageFromResponse = this.extractMessage(exceptionResponse);
    const message = authInfo || messageFromResponse || exception.message || defaultMessage;
    const errorCode = this.asString((responseObject as { errorCode?: unknown }).errorCode);

    return {
      statusCode: status,
      name,
      message,
      ...(errorCode ? { errorCode } : {}),
      timestamp,
      path,
    };
  }

  private extractMessage(exceptionResponse: unknown): string | undefined {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse) {
      const message = (exceptionResponse as { message?: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
      if (Array.isArray(message) && message.every((entry) => typeof entry === 'string')) {
        return message.join(', ');
      }
    }
    return undefined;
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }
}
