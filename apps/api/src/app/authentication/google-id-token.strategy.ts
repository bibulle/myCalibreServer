/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import GoogleTokenStrategy = require('passport-google-id-token');


class RealGoogleIdTokenStrategy extends PassportStrategy(GoogleTokenStrategy, 'google-id-token') {
  readonly logger = new Logger(RealGoogleIdTokenStrategy.name);

  private static readonly SCOPES = ['profile'];

  constructor(private readonly _usersService: UsersService, _clientID: string, clientSecret: string, callbackURL: string) {
    //noinspection JSUnusedGlobalSymbols
    super(
      {
        clientID: _clientID,
        clientSecret: clientSecret,
        callbackURL: callbackURL,
        passReqToCallback: false,
        scope: RealGoogleIdTokenStrategy.SCOPES,
      },
      (parsedToken, tokenId: string, done: any) => {
        try {
          const profile = parsedToken.payload;

          this.logger.debug(`validate ${profile.displayName}`);
          // console.trace();

          this._usersService
            .findByGoogleId(tokenId)
            .then((user) => {
              // this.logger.debug(user);

              if (user) {
                // user exist
                // const jwt = this._usersService.createToken(user);

                return done(null, user);
              } else {
                // user do not exist (create it)
                const firstName = profile.given_name || profile.name.replace(/ [^ ]*$/, '');
                const lastName = profile.family_name || profile.name.replace(/^.* /, '');
                const email = profile.emails

                const newUser = this._usersService.createUser({
                  local: {
                    username: profile.username,
                    firstname: firstName,
                    lastname: lastName,
                    email: email,
                  },
                  google: {
                    id: profile.sub,
                    name: profile.name,
                    email: email,
                  },
                });
                // this._usersService.saveUser(newUser);
                return done(null, newUser);
              }
            })
            .catch((err) => {
              this.logger.error('Status : ' + err.status + ' (' + err.message.message + ')');
              this.logger.error(err);
              throw new UnauthorizedException('unauthorized', err.message);
            });
        } catch (err) {
          this.logger.error('Status : ' + err.status + ' (' + err.message.message + ')');
          this.logger.error(err);
          throw new UnauthorizedException('unauthorized', err.message);
        }
      }
    );
  }
}

@Injectable()
export class GoogleIdTokenStrategy {
  constructor(
    // private readonly calendarService: CalendarService,
    private readonly _usersService: UsersService,
    private readonly _configService: ConfigService
  ) {
    this.strategy = new RealGoogleIdTokenStrategy(
      // this.calendarService,
      this._usersService,
      this._configService.get('AUTHENT_GOOGLE_ANDROID_CLIENTID'),
      this._configService.get('AUTHENT_GOOGLE_ANDROID_CLIENTSECRET'),
      this._configService.get('AUTHENT_GOOGLE_CALLBACKURL')
    );
  }

  strategy: RealGoogleIdTokenStrategy;
}
