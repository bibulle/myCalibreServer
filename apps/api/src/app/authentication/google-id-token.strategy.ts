/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';

class RealGoogleIdTokenStrategy extends PassportStrategy(Strategy, 'google-id-token') {
  readonly logger = new Logger(RealGoogleIdTokenStrategy.name);

  private readonly _oauthClient: OAuth2Client;

  constructor(
    private readonly _usersService: UsersService,
    private readonly _clientID: string
  ) {
    super();
    this._oauthClient = new OAuth2Client(this._clientID);
  }

  async validate(req: any): Promise<any> {
    try {
      const idToken = req.query?.id_token || req.body?.id_token;

      if (!idToken) {
        throw new UnauthorizedException('No id_token provided');
      }

      const ticket = await this._oauthClient.verifyIdToken({
        idToken,
        audience: this._clientID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const googleId = payload.sub;
      this.logger.debug(`validate ${payload.name}`);

      const user = await this._usersService.findByGoogleId(googleId);

      if (user) {
        return user;
      } else {
        // user does not exist (create it)
        const firstName = payload.given_name || (payload.name ? payload.name.replace(/ [^ ]*$/, '') : '');
        const lastName = payload.family_name || (payload.name ? payload.name.replace(/^.* /, '') : '');
        const email = payload.email;

        const newUser = this._usersService.createUser({
          local: {
            username: undefined,
            firstname: firstName,
            lastname: lastName,
            email: email,
          },
          google: {
            id: googleId,
            name: payload.name,
            email: email,
          },
        });
        return newUser;
      }
    } catch (err) {
      this.logger.error(err);
      throw new UnauthorizedException('unauthorized');
    }
  }
}

@Injectable()
export class GoogleIdTokenStrategy {
  constructor(
    private readonly _usersService: UsersService,
    private readonly _configService: ConfigService
  ) {
    this.strategy = new RealGoogleIdTokenStrategy(
      this._usersService,
      this._configService.get('AUTHENT_GOOGLE_ANDROID_CLIENTID')
    );
  }

  strategy: RealGoogleIdTokenStrategy;
}
