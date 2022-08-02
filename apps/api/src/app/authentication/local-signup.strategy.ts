import { User } from '@my-calibre-server/api-interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UsersService } from '../users/users.service';

class RealLocalSignupStrategy extends PassportStrategy(Strategy, 'local-signup') {
  static readonly logger = new Logger(RealLocalSignupStrategy.name);

  constructor(private _userService: UsersService) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super({passReqToCallback: true}, (req: Request, username:string, password:string, done: any) => {
      RealLocalSignupStrategy.logger.debug('local-signup');

      const firstname = req.body['firstname'] || '';
      const lastname = req.body['lastname'] || '';
      const email = req.body['email'] || '';

      // RealLocalSignupStrategy.logger.debug(`${username} ${password} ${JSON.stringify(req.body)}`);

      // find a user whose username is the same as the forms username
      // we are checking to see if the user trying to login already exists
      this._userService
        .findByUsername(username)
        .then((user) => {
          // if no user is found, return the message
          if (user) {
            RealLocalSignupStrategy.logger.warn("That username already exists.")
            return done(null, false, 'That username already exists.');
          } else {
            const newUser:User = this._userService.createUser({
              local: {
                username: username,
                password: password,
                firstname: firstname,
                lastname: lastname,
                email: email
              }
            });

            this._userService.saveUser(newUser)
            .then(()=>{
              return done(null, newUser);
            })
            .catch(err => {
              RealLocalSignupStrategy.logger.error(err);
              return done(err);    
            });


          // all is well, return successful user
          }
        })
        .catch((err) => {
          RealLocalSignupStrategy.logger.error(err);
          return done(err);
        });
    });
  }
}

@Injectable()
export class LocalSignupStrategy {
  constructor(private readonly _userService: UsersService) {
    this.strategy = new RealLocalSignupStrategy(this._userService);
  }

  strategy: RealLocalSignupStrategy;
}
