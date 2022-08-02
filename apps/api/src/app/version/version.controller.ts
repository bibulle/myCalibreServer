import { ApiReturn, User } from '@my-calibre-server/api-interfaces';
import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { VersionService } from './version.service';

@Controller('version')
export class VersionController {
  constructor(private _vesionService: VersionService) {}

  @Get('')
  async version(): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      resolve({
        version: this._vesionService.getVersion(),
      });
    });
  }
}
