import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

class RealJwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  readonly logger = new Logger(RealJwtAdminStrategy.name);

  constructor(jwtSecret: string) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async validate(payload, done: any) {
    try {
      if (payload?.local?.isAdmin) {
        done(null, payload);
      } else {
        throw new UnauthorizedException('unauthorized');
      }
    } catch (err) {
      throw new UnauthorizedException('unauthorized', err.message);
    }
  }
}

@Injectable()
export class JwtAdminStrategy {
  constructor(private readonly _configService: ConfigService) {
    this.strategy = new RealJwtAdminStrategy(this._configService.get("AUTHENT_JWT_SECRET"));
  }

  strategy: RealJwtAdminStrategy;
}
