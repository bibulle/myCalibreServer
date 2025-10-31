import { ApiReturn, Status } from '@my-calibre-server/api-interfaces';
import { Controller, Get, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { CacheKey } from '../cache/cache.service';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  readonly logger = new Logger(HealthController.name);

  constructor(private _healthService: HealthService) {}

  @Get('')
  async getBStatus(): Promise<ApiReturn> {
    try {
      const status = await this._healthService.getHealthSattus();
      return { status };
    } catch (err) {
      this.logger.error('Health check failed', err);
      throw new HttpException('Health check failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
