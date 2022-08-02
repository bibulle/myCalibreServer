import { Module } from '@nestjs/common';
import { VersionService } from './version.service';
import { VersionController } from './version.controller';

@Module({
  providers: [VersionService],
  exports: [VersionService],
  controllers: [VersionController],
})
export class VersionModule {}
