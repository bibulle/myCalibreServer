import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';
import { SeriesModule } from '../series/series.module';
import { UsersModule } from '../users/users.module';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

@Module({
  imports:[DatabaseModule, UsersModule, ConfigModule, CacheModule, SeriesModule], 
  providers: [BooksService],
  exports: [BooksService],
  controllers: [BooksController],
})
export class BooksModule {}
