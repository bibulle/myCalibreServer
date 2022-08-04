import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UniqueTokenStrategy } from 'passport-unique-token';
import { UsersService } from '../users/users.service';

class RealTemporaryTokenStrategy extends PassportStrategy(UniqueTokenStrategy, 'temporary-token') {
  static readonly logger = new Logger(RealTemporaryTokenStrategy.name);

  constructor(private _userService: UsersService) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super((token: string, done: any) => {
      RealTemporaryTokenStrategy.logger.debug('temporary-token');

      token = token.replace(/ /g,'+');
      // RealTemporaryTokenStrategy.logger.debug(token);


      // find a user whose username is the same as the forms username
      // we are checking to see if the user trying to login already exists
      this._userService
        .findByTemporaryToken(token)
        .then((user) => {
          // if no user is found, return the message
          if (!user) {
            RealTemporaryTokenStrategy.logger.warn("That token do not exist.")
            return done(null, false, 'That token do not exist.');
          } else {
          // if the user is found but the password is wrong
          if (!this._userService.validTemporaryToken(user, token)) {
            //return done(null, false, req.flash('loginMessage', 'Your user or your password is wrong.')); // create the loginMessage and save it to session as flashdata
            return done(null, false, 'Your user or your password is wrong.');
          }

          // all is well, return successful user
          return done(null, user);
        }
        })
        .catch((err) => {
          RealTemporaryTokenStrategy.logger.error(err);
          return done(err);
        });
    });

  }
}

@Injectable()
export class TemporaryTokenStrategy {
  constructor(private readonly _userService: UsersService) {
    this.strategy = new RealTemporaryTokenStrategy(this._userService);
  }

  strategy: RealTemporaryTokenStrategy;
}
