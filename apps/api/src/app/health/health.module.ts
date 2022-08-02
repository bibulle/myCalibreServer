import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports : [CacheModule, DatabaseModule],
  providers: [HealthService],
  controllers: [HealthController],
  exports: [HealthService]
})
export class HealthModule {}
