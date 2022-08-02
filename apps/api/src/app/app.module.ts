import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthenticationModule } from './authentication/authentication.module';
import { AuthorsModule } from './authors/authors.module';
import { BooksModule } from './books/books.module';
import { CacheModule } from './cache/cache.module';
import { DatabaseModule } from './database/database.module';
import { HttpExceptionFilter } from './filter/http-exception.filter';
import { HealthModule } from './health/health.module';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { StatusInterceptor } from './interceptors/status.interceptor';
import { SeriesModule } from './series/series.module';
import { TagsModule } from './tags/tags.module';
import { UsersModule } from './users/users.module';
import { VersionModule } from './version/version.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    AuthenticationModule,
    UsersModule,
    // DatabaseModule,
    // CacheModule,
    BooksModule,
    SeriesModule,
    AuthorsModule,
    TagsModule,
    VersionModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: StatusInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // {
    //   provide: APP_FILTER,
    //   useClass: AllExceptionsFilter,
    // }
  ],
})
export class AppModule {}
