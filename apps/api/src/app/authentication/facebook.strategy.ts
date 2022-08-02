import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { UsersService } from '../users/users.service';

class RealFacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  readonly logger = new Logger(RealFacebookStrategy.name);

  constructor(private readonly _usersService: UsersService, _clientID: string, clientSecret: string, callbackURL: string) {
    super(
      {
        clientID: _clientID,
        clientSecret: clientSecret,
        callbackURL: callbackURL,
        passReqToCallback: false,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (accessToken: string, refreshToken: string, profile, done: any) => {
        try {
          this.logger.debug(`validate ${profile.displayName}`);
          // console.trace();
          this._usersService
          .findByFacebookId(profile.id)
          .then((user) => {
            // this.logger.debug(user);
  
            if (user) {
              // user exist  
              // const jwt = this._usersService.createToken(user);
  
              return done(null, user);
            } else {
              // user do not exist (create it)
              const firstName = profile.name.givenName || profile.displayName.replace(/ [^ ]*$/, '');
              const lastName = profile.name.familyName || profile.displayName.replace(/^.* /, '');
              let email = null;
              if (profile.emails) {
                email = profile.emails[0].value;
              }
  
              const newUser = this._usersService.createUser({
                local: {
                  username: profile.username,
                  firstname: firstName,
                  lastname: lastName,
                  email: email,
                },
                facebook: {
                  id: profile.id, // set the users facebook id
                  name: profile.displayName,
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
export class FacebookStrategy {
  constructor(private readonly _usersService: UsersService, private readonly _configService: ConfigService) {
    this.strategy = new RealFacebookStrategy(
      // this.calendarService,
      this._usersService,
      this._configService.get('AUTHENT_FACEBOOK_CLIENTID'),
      this._configService.get('AUTHENT_FACEBOOK_CLIENTSECRET'),
      this._configService.get('AUTHENT_FACEBOOK_CALLBACKURL')
    );
  }

  strategy: RealFacebookStrategy;
}
