import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [TagsController],
  providers: [TagsService],
})
export class TagsModule {}
