import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { CacheService } from './cache.service';

@Module({
  imports: [UsersModule, ConfigModule,  DatabaseModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
