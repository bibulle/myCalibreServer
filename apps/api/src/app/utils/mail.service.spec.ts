import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('MailService', () => {
  let service: MailService;
  let sendMailMock: jest.Mock;

  const configValues: Record<string, string> = {
    SMTP_ENCRYPTION: 'SSL',
    SMTP_USER_NAME: 'user@example.com',
    SMTP_PASSWORD: 'secret',
    SMTP_SERVER_NAME: 'smtp.example.com',
  };

  const mockConfigService = {
    get: jest.fn((key: string) => configValues[key]),
  };

  beforeEach(async () => {
    sendMailMock = jest.fn();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: sendMailMock });

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should build an smtps:// transport URL with the username percent-encoded when SSL is configured', async () => {
    sendMailMock.mockImplementation((options, cb) => cb(null));

    await service.sendMail('dest@example.com', 'Subject', '<p>body</p>');

    expect(nodemailer.createTransport).toHaveBeenCalledWith('smtps://user%40example.com:secret@smtp.example.com');
  });

  it('should build a plain smtp:// transport URL when SSL is not configured', async () => {
    configValues['SMTP_ENCRYPTION'] = 'NONE';
    sendMailMock.mockImplementation((options, cb) => cb(null));

    await service.sendMail('dest@example.com', 'Subject', '<p>body</p>');

    expect(nodemailer.createTransport).toHaveBeenCalledWith('smtp://user%40example.com:secret@smtp.example.com');

    configValues['SMTP_ENCRYPTION'] = 'SSL';
  });

  it('should send mail with from/to/subject/html and no attachment by default', async () => {
    sendMailMock.mockImplementation((options, cb) => cb(null));

    await service.sendMail('dest@example.com', 'Hello', '<p>Hi</p>');

    expect(sendMailMock).toHaveBeenCalledWith(
      {
        from: '<user@example.com>',
        to: 'dest@example.com',
        subject: 'Hello',
        html: '<p>Hi</p>',
      },
      expect.any(Function)
    );
  });

  it('should include an attachment when filename and path are both provided', async () => {
    sendMailMock.mockImplementation((options, cb) => cb(null));

    await service.sendMail('dest@example.com', 'Hello', '<p>Hi</p>', 'book.epub', '/tmp/book.epub');

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [{ filename: 'book.epub', path: '/tmp/book.epub' }],
      }),
      expect.any(Function)
    );
  });

  it('should not add an attachment when only the filename is provided', async () => {
    sendMailMock.mockImplementation((options, cb) => cb(null));

    await service.sendMail('dest@example.com', 'Hello', '<p>Hi</p>', 'book.epub');

    expect(sendMailMock).toHaveBeenCalledWith(expect.not.objectContaining({ attachments: expect.anything() }), expect.any(Function));
  });

  it('should reject and log when sending the mail fails', async () => {
    const error = new Error('SMTP down');
    sendMailMock.mockImplementation((options, cb) => cb(error));
    const loggerErrorSpy = jest.spyOn(service.logger, 'error').mockImplementation(() => undefined);

    await expect(service.sendMail('dest@example.com', 'Hello', '<p>Hi</p>')).rejects.toBe(error);
    expect(loggerErrorSpy).toHaveBeenCalledWith(error);
  });
});
