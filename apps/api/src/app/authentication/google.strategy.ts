/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { UsersService } from '../users/users.service';

class RealGoogleStrategy extends PassportStrategy(Strategy, 'google') {
  readonly logger = new Logger(RealGoogleStrategy.name);

  private static readonly SCOPES = ['profile'];

  constructor(private readonly _usersService: UsersService, _clientID: string, clientSecret: string, callbackURL: string) {
    //noinspection JSUnusedGlobalSymbols
    super({
      clientID: _clientID,
      clientSecret: clientSecret,
      callbackURL: callbackURL,
      passReqToCallback: false,
      scope: RealGoogleStrategy.SCOPES,
    }, 
    (accessToken: string, refreshToken: string, profile, done: any) => {
      try {
        this.logger.debug(`validate ${profile.displayName}`);
        // console.trace();
  
        this._usersService
          .findByGoogleId(profile.id)
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
                google: {
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
    });
  }

  // async validate(request: any, accessToken: string, refreshToken: string, profile, done: any) {
  //   try {
  //     // this.logger.debug(refreshToken);
  //     this.logger.debug(`validate ${profile.displayName}`);
  //     // console.trace();

  //     this._usersService
  //       .findByGoogleId(profile.id)
  //       .then((user) => {
  //         // this.logger.debug(user);

  //         if (user) {
  //           // user exist
  //           this.logger.debug('done');

  //           const jwt = this._usersService.createToken(user);
  //           this.logger.debug(jwt);

  //           return done(null, {jwt});
  //         } else {
  //           // user do not exist (create it)
  //           const firstName = profile.name.givenName || profile.displayName.replace(/ [^ ]*$/, '');
  //           const lastName = profile.name.familyName || profile.displayName.replace(/^.* /, '');
  //           let email = null;
  //           if (profile.emails) {
  //             email = profile.emails[0].value;
  //           }

  //           const newUser = this._usersService.createUser({
  //             local: {
  //               username: profile.username,
  //               firstname: firstName,
  //               lastname: lastName,
  //               email: email,
  //             },
  //             google: {
  //               id: profile.id, // set the users facebook id
  //               name: profile.displayName,
  //               email: email,
  //             },
  //           });
  //           this._usersService.saveUser(newUser);
  //           return done(null, newUser);
  //         }
  //       })
  //       .catch((err) => {
  //         this.logger.error('Status : ' + err.status + ' (' + err.message.message + ')');
  //         this.logger.error(err);
  //         throw new UnauthorizedException('unauthorized', err.message);
  //       });
  //   } catch (err) {
  //     this.logger.error('Status : ' + err.status + ' (' + err.message.message + ')');
  //     this.logger.error(err);
  //     throw new UnauthorizedException('unauthorized', err.message);
  //   }
  // }
}

@Injectable()
export class GoogleStrategy {
  constructor(
    // private readonly calendarService: CalendarService,
    private readonly _usersService: UsersService,
    private readonly _configService: ConfigService
  ) {
    this.strategy = new RealGoogleStrategy(
      // this.calendarService,
      this._usersService,
      this._configService.get('AUTHENT_GOOGLE_CLIENTID'),
      this._configService.get('AUTHENT_GOOGLE_CLIENTSECRET'),
      this._configService.get('AUTHENT_GOOGLE_CALLBACKURL')
    );
  }

  strategy: RealGoogleStrategy;
}
