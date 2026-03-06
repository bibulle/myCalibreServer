import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { UserService } from '../authent/user.service';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockSnackBar: jest.Mocked<MatSnackBar>;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    mockSnackBar = {
      open: jest.fn(),
    } as any;

    mockUserService = {
      logout: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [NotificationService, { provide: MatSnackBar, useValue: mockSnackBar }, { provide: UserService, useValue: mockUserService }],
    });

    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('message', () => {
    it('should display message with 5000ms duration', () => {
      service.message('Test message');

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Test message',
        undefined,
        expect.objectContaining({
          duration: 5000,
          panelClass: ['message'],
        })
      );
    });

    it('should apply message panel class', () => {
      service.message('Info text');

      const config = mockSnackBar.open.mock.calls[0][2] as MatSnackBarConfig;
      expect(config.panelClass).toEqual(['message']);
    });
  });

  describe('info', () => {
    it('should log to console and display info', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      service.info('Information');

      expect(consoleLogSpy).toHaveBeenCalledWith('Information');
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Information',
        undefined,
        expect.objectContaining({
          duration: 5000,
        })
      );

      consoleLogSpy.mockRestore();
    });

    it('should not apply extra classes for info', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      service.info('Info message');

      const config = mockSnackBar.open.mock.calls[0][2] as MatSnackBarConfig;
      expect(config.panelClass).toBeUndefined();

      consoleLogSpy.mockRestore();
    });
  });

  describe('warn', () => {
    it('should log to console.warn and display warning', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      service.warn('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalledWith('Warning message');
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Warning message',
        undefined,
        expect.objectContaining({
          duration: 5000,
          panelClass: ['warn'],
        })
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('error', () => {
    it('should log to console.error and display error', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      service.error('Error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(JSON.stringify('Error message'));
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error message',
        undefined,
        expect.objectContaining({
          duration: 5000,
          panelClass: ['error'],
        })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should extract message from error object', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const error = { statusText: 'Bad Request' };
      service.error(error as any);

      expect(mockSnackBar.open).toHaveBeenCalledWith('Bad Request', undefined, expect.any(Object));

      consoleErrorSpy.mockRestore();
    });

    it('should handle null/undefined error', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      service.error(null as any);

      expect(mockSnackBar.open).toHaveBeenCalledWith('Unknown error', undefined, expect.any(Object));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('_display', () => {
    it('should create snackbar with correct config', () => {
      service['_display']('Test', 3000, ['custom']);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Test',
        undefined,
        expect.objectContaining({
          duration: 3000,
          panelClass: ['custom'],
        })
      );
    });

    it('should handle null extraClasses', () => {
      service['_display']('Test', 2000, null);

      const config = mockSnackBar.open.mock.calls[0][2] as MatSnackBarConfig;
      expect(config.panelClass).toBeUndefined();
    });

    it('should use specified duration', () => {
      service['_display']('Message', 10000, null);

      const config = mockSnackBar.open.mock.calls[0][2] as MatSnackBarConfig;
      expect(config.duration).toBe(10000);
    });
  });

  describe('_extractMessage', () => {
    it('should return default message for null error', () => {
      const message = service['_extractMessage'](null);
      expect(message).toBe('Unknown error');
    });

    it('should return default message for undefined error', () => {
      const message = service['_extractMessage'](undefined);
      expect(message).toBe('Unknown error');
    });

    it('should return string error as is', () => {
      const message = service['_extractMessage']('Simple error');
      expect(message).toBe('Simple error');
    });

    it('should extract statusText from error', () => {
      const error = { statusText: 'Not Found' };
      const message = service['_extractMessage'](error);
      expect(message).toBe('Not Found');
    });

    it('should parse _body and extract message', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const error = {
        _body: JSON.stringify({ message: 'Detailed error message' }),
      };

      const message = service['_extractMessage'](error);
      expect(message).toBe('Detailed error message');

      consoleLogSpy.mockRestore();
    });

    it('should logout user on JsonWebTokenError', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const error = {
        _body: JSON.stringify({
          error: { name: 'JsonWebTokenError' },
          message: 'Invalid token',
        }),
      };

      service['_extractMessage'](error);

      expect(mockUserService.logout).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should prefer message from parsed body over statusText', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const error = {
        statusText: 'Server Error',
        _body: JSON.stringify({ message: 'Specific error' }),
      };

      const message = service['_extractMessage'](error);
      expect(message).toBe('Specific error');

      consoleLogSpy.mockRestore();
    });

    it('should fallback to statusText if message not in body', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const error = {
        statusText: 'Fallback error',
        _body: JSON.stringify({ error: {} }),
      };

      const message = service['_extractMessage'](error);
      expect(message).toBe('Fallback error');

      consoleLogSpy.mockRestore();
    });

    it('should extract message from Angular HttpClient err.error object', () => {
      const error = {
        status: 404,
        statusText: 'Not Found',
        error: { statusCode: 404, name: 'BookNotFoundException', message: 'Book with ID 42 not found', errorCode: 'RESOURCE_NOT_FOUND' },
      };

      const message = service['_extractMessage'](error);
      expect(message).toBe('Book with ID 42 not found');
    });

    it('should fallback to statusText when err.error has no message', () => {
      const error = {
        status: 500,
        statusText: 'Internal Server Error',
        error: { statusCode: 500, name: 'Error' },
      };

      const message = service['_extractMessage'](error);
      expect(message).toBe('Internal Server Error');
    });

    it('should logout user on JsonWebTokenError in err.error', () => {
      const error = {
        status: 401,
        statusText: 'Unauthorized',
        error: { error: { name: 'JsonWebTokenError' }, message: 'Invalid token' },
      };

      service['_extractMessage'](error);

      expect(mockUserService.logout).toHaveBeenCalled();
    });
  });

  describe('integration', () => {
    it('should handle different notification types correctly', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      service.message('Message 1');
      service.info('Info 1');
      service.warn('Warning 1');
      service.error('Error 1');

      expect(mockSnackBar.open).toHaveBeenCalledTimes(4);

      // Check panel classes
      const calls = mockSnackBar.open.mock.calls;
      expect((calls[0][2] as MatSnackBarConfig).panelClass).toEqual(['message']);
      expect((calls[1][2] as MatSnackBarConfig).panelClass).toBeUndefined();
      expect((calls[2][2] as MatSnackBarConfig).panelClass).toEqual(['warn']);
      expect((calls[3][2] as MatSnackBarConfig).panelClass).toEqual(['error']);

      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should maintain 5000ms duration for all notification types', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      service.message('Test');
      service.info('Test');
      service.warn('Test');
      service.error('Test');

      mockSnackBar.open.mock.calls.forEach((call) => {
        expect((call[2] as MatSnackBarConfig).duration).toBe(5000);
      });

      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
