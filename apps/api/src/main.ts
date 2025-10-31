import { Logger, LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as expressSession from 'express-session';
import * as passport from 'passport';

import { AppModule } from './app/app.module';

async function bootstrap() {
  let logger_levels: LogLevel[] = ['error', 'warn', 'log'];
  if (process.env.LOG_LEVEL) {
    switch (process.env.LOG_LEVEL.toUpperCase()) {
      case 'VERBOSE':
        logger_levels = ['error', 'warn', 'log', 'debug', 'verbose'];
        break;
      case 'DEBUG':
        logger_levels = ['error', 'warn', 'log', 'debug'];
        break;
      case 'LOG':
        logger_levels = ['error', 'warn', 'log'];
        break;
      default:
        logger_levels = ['error', 'warn'];
        break;
    }
  }

  const app = await NestFactory.create(AppModule, {
    logger: logger_levels,
  });

  console.log(`LOG_LEVEL : ${process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'LOG (by default)'}`);

  // app.useGlobalInterceptors(new LoggingInterceptor());
  // app.useGlobalFilters(new HttpExceptionFilter());

  // configure passport (for authentication)
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    Logger.error('❌ SESSION_SECRET environment variable is not set!');
    Logger.error('   Please set SESSION_SECRET in your environment or .env file');
    Logger.error('   Example: SESSION_SECRET=your-random-secret-here');
    process.exit(1);
  }
  
  app.use(
    expressSession({
      secret: sessionSecret,
      resave: true,
      saveUninitialized: true,
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const port = process.env.PORT || 3333;
  await app
    .listen(port)
    .then(() => {
      Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
    })
    .catch((reason) => {
      Logger.error('Error on serveur');
      Logger.error(reason);
    });
}

bootstrap();
