import { MessageLog, MessageLogLevel } from '@my-calibre-server/api-interfaces';
import { Body, Controller, Logger, Post } from '@nestjs/common';

@Controller()
export class AppController {
  readonly loggerFrontend = new Logger('FrontEnd');

  @Post('/logs')
  createLog(@Body() message: MessageLog): MessageLog {
    let mess = message.message;
    if (message.additional && message.additional.length > 0) {
      mess += ' ' + JSON.stringify(message.additional[0]);
    }

    switch (message.level) {
      case MessageLogLevel.TRACE:
      case MessageLogLevel.DEBUG:
      case MessageLogLevel.INFO:
      case MessageLogLevel.LOG:
        this.loggerFrontend.debug(mess + ' (' + message.fileName + message.lineNumber + ')');
        break;
      case MessageLogLevel.WARN:
        this.loggerFrontend.warn(mess + ' (' + message.fileName + message.lineNumber + ')');
        break;
      case MessageLogLevel.ERROR:
      case MessageLogLevel.FATAL:
      default:
        this.loggerFrontend.error(mess + ' (' + message.fileName + message.lineNumber + ')');
        break;
    }

    return message;
  }
}
