import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendMailOptions } from 'nodemailer';
import nodemailer = require('nodemailer');

@Injectable()
export class MailService {
  readonly logger = new Logger(MailService.name);

  constructor(private _configService: ConfigService) {}

  sendMail(toMail: string, subject: string, text: string, attachment_filename?: string, attachment_path?: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Send mail
      const urlSmtp = `smtp${this._configService.get('SMTP_ENCRYPTION') == 'SSL' ? 's' : ''}://${this._configService.get('SMTP_USER_NAME').replace('@', '%40')}:${this._configService.get(
        'SMTP_PASSWORD'
      )}@${this._configService.get('SMTP_SERVER_NAME')}`;
      const transporter = nodemailer.createTransport(urlSmtp);

      const options = {
        from: `<${this._configService.get('SMTP_USER_NAME')}>`,
        to: `${toMail}`,
        subject: subject,
        html: text
      } as SendMailOptions;

      if (attachment_filename && attachment_path) {
        options.attachments = [
          {
            filename: attachment_filename,
            path: attachment_path,
          },
        ]
      }

      transporter.sendMail(options, (error) => {
        if (error) {
          this.logger.error(error);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}
