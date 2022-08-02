import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CalibreDbService } from './calibre-db.service';
import { MyCalibreDbService } from './my-calibre-db.service';
import { CalibreDb1Service } from './calibre-db1.service';

@Module({
  imports: [ConfigModule],
  providers: [MyCalibreDbService, CalibreDbService, CalibreDb1Service],
  exports: [MyCalibreDbService, CalibreDbService, CalibreDb1Service],
})
export class DatabaseModule {}
