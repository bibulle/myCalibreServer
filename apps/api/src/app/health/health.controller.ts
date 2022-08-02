import { ApiReturn, Status } from '@my-calibre-server/api-interfaces';
import { Controller, Get, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { CacheDateKey } from '../cache/cache.service';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  readonly logger = new Logger(HealthController.name);

  constructor(private _healthService: HealthService) {}

  @Get('')
  async getBStatus(): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      this._healthService
        .getHealthSattus()
        .then((status) => {
          resolve({ status: status });
        })
        .catch((err) => {
          this.logger.error(err);
          throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });
  }
}
