import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UsersService } from '../users/users.service';

class RealLocalStrategy extends PassportStrategy(Strategy, 'local') {
  static readonly logger = new Logger(RealLocalStrategy.name);

  constructor(private _userService: UsersService) {
    super({}, (username, password, done: any) => {
      RealLocalStrategy.logger.debug('local-login');

      // find a user whose username is the same as the forms username
      // we are checking to see if the user trying to login already exists
      this._userService
        .findByUsername(username)
        .then((user) => {
          // if no user is found, return the message
          if (!user) {
            return done(null, false, 'Your user or your password is wrong.');
          }

          // if the user is found but the password is wrong
          if (!this._userService.validPassword(user, password)) {
            //return done(null, false, req.flash('loginMessage', 'Your user or your password is wrong.')); // create the loginMessage and save it to session as flashdata
            return done(null, false, 'Your user or your password is wrong.');
          }

          // all is well, return successful user
          return done(null, user);
        })
        .catch((err) => {
          RealLocalStrategy.logger.error(err);
          return done(err);
        });
    });
  }
}

@Injectable()
export class LocalStrategy {
  constructor(private readonly _userService: UsersService) {
    this.strategy = new RealLocalStrategy(this._userService);
  }

  strategy: RealLocalStrategy;
}
