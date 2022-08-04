import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { UtilsModule } from '../utils/utils.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [UtilsModule, ConfigModule, DatabaseModule],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController]
})
export class UsersModule {}
