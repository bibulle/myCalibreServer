import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const buildHost = (request: Partial<Request>, response: { status: jest.Mock; json: jest.Mock }): ArgumentsHost => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;
  };

  it('should format HttpException with standardized payload', () => {
    const filter = new HttpExceptionFilter();
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const request = {
      method: 'GET',
      url: '/book/12',
      authInfo: undefined,
    };
    const exception = new HttpException(
      {
        message: 'Book with ID 12 not found',
        errorCode: 'RESOURCE_NOT_FOUND',
      },
      HttpStatus.NOT_FOUND
    );

    filter.catch(exception, buildHost(request as never, response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        name: 'HttpException',
        message: 'Book with ID 12 not found',
        errorCode: 'RESOURCE_NOT_FOUND',
        path: '/book/12',
      })
    );
  });

  it('should format unknown errors as internal server error', () => {
    const filter = new HttpExceptionFilter();
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const request = {
      method: 'GET',
      url: '/book',
      authInfo: undefined,
    };

    filter.catch(new Error('boom'), buildHost(request as never, response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        name: 'Error',
        message: 'Internal server error',
        path: '/book',
      })
    );
  });
});
