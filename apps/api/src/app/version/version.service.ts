import { Version } from '@my-calibre-server/api-interfaces';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VersionService {


  getVersion() : Version {
    return new Version();
  }
}
