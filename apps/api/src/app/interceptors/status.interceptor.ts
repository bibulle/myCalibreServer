import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { VersionService } from '../version/version.service';
import { HealthService } from '../health/health.service';

@Injectable()
export class StatusInterceptor implements NestInterceptor {
  readonly logger = new Logger(StatusInterceptor.name);

  constructor(private _versionService: VersionService, private _healthService: HealthService) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {

    return next.handle().pipe(
      map(async (data) => {

        if (!data.version) {
          data.version = this._versionService.getVersion();
        } 
        if (!data.status) {
          data.status = await this._healthService.getHealthSattus();
        } 
        // this.logger.log(`${JSON.stringify(data, null, 2)}`);

        return data;
      })
    );
  }
}
