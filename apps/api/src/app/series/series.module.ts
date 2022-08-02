import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';
import { SeriesController } from './series.controller';
import { SeriesService } from './series.service';

@Module({
  imports: [DatabaseModule, CacheModule],
  providers: [SeriesService],
  exports: [SeriesService],
  controllers: [SeriesController],
})
export class SeriesModule {}
