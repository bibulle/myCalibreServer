import { ApiReturn, User } from '@my-calibre-server/api-interfaces';
import { Controller, Get, HttpCode, HttpException, HttpStatus, Logger, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../users/users.service';

@Controller('authent')
export class AuthenticationController {
  readonly logger = new Logger(AuthenticationController.name);

  constructor(private _userService: UsersService) {}

  // =====================================
  // GOOGLE ROUTES =======================
  // =====================================
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin(@Req() req) {
    // initiates the Google OAuth2 login flow
    this.logger.debug('googleLogin');
    this.logger.debug(req.user);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard(['google']))
  async googleLoginCallback(@Req() req): Promise<ApiReturn> {
    // this.logger.debug('googleLoginCallback');
    let connectedUser: User;
    await this._userService
      .getBearerUser(req)
      .then((u) => {
        connectedUser = u;
      })
      .catch((r) => {
        this.logger.warn(r);
        connectedUser = undefined;
      });

    // this.logger.debug(connectedUser);

    const user: User = req.user as User;
    // this.logger.debug(user);
    if (user) {
      const ret: ApiReturn = {};

      if (connectedUser) {
        connectedUser.google = user.google;
        this._userService.saveUser(connectedUser);
        ret.id_token = this._userService.createToken(connectedUser);
        ret.user = connectedUser;
      } else {
        this._userService.updateLastConnection(user);
        ret.id_token = this._userService.createToken(user);
      }

      return ret;
    } else {
      throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('google-id-token')
  @UseGuards(AuthGuard(['google-id-token']))
  async googleIdTokenLogin(@Req() req): Promise<ApiReturn> {
    // this.logger.debug('googleIdTokenLogin');

    const user: User = req.user as User;
    // this.logger.debug(user);
    if (user) {
      const ret: ApiReturn = {};

      this._userService.updateLastConnection(user);
      ret.id_token = this._userService.createToken(user);

      return ret;
    } else {
      throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('google/unlink')
  @UseGuards(AuthGuard(['jwt']))
  googleUnlink(@Req() req, @Query('userId') modifiedUserId: string): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      // this.logger.debug(modifiedUserId);
      if (!modifiedUserId || modifiedUserId.length === 0) {
        throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
      }

      modifiedUserId = modifiedUserId.replace(/ /g, '+');

      const user: User = req.user as User;
      if (user) {
        if (modifiedUserId !== user.id) {
          if (!user.local.isAdmin) {
            throw new HttpException('Not authorized', HttpStatus.UNAUTHORIZED);
          } else {
            this._userService
              .findById(modifiedUserId)
              .then((modifiedUser) => {
                if (modifiedUser) {
                  modifiedUser.google = {};
                  this._userService.saveUser(modifiedUser, true);
                  resolve({
                    user: this._userService.user2API(modifiedUser),
                  });
                } else {
                  throw new HttpException('User not found 1', HttpStatus.NOT_FOUND);
                }
              })
              .catch((reason) => {
                this.logger.error(reason);
                throw new HttpException('User not found 2', HttpStatus.NOT_FOUND);
              });
          }
        } else {
          user.google = {};
          this._userService.saveUser(user, true);
          resolve({
            user: this._userService.user2API(user),
            id_token: this._userService.createToken(user),
          });
        }
      } else {
        throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  }
  // =====================================
  // FACEBOOK ROUTES =====================
  // =====================================
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  facebookLogin(@Req() req) {
    // initiates the Google OAuth2 login flow
    this.logger.debug('facebookLogin');
    this.logger.debug(req.user);
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard(['facebook']))
  async facebookjLoginCallback(@Req() req): Promise<ApiReturn> {
    // this.logger.debug('facebookLoginCallback');
    let connectedUser: User;
    await this._userService
      .getBearerUser(req)
      .then((u) => {
        connectedUser = u;
      })
      .catch((r) => {
        this.logger.warn(r);
        connectedUser = undefined;
      });

    // this.logger.debug(connectedUser);

    const user: User = req.user as User;
    // this.logger.debug(user);
    if (user) {
      const ret: ApiReturn = {};

      if (connectedUser) {
        connectedUser.facebook = user.facebook;
        this._userService.saveUser(connectedUser);
        ret.id_token = this._userService.createToken(connectedUser);
        ret.user = connectedUser;
      } else {
        this._userService.updateLastConnection(user);
        ret.id_token = this._userService.createToken(user);
      }

      return ret;
    } else {
      throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('facebook/unlink')
  @UseGuards(AuthGuard(['jwt']))
  facebookUnlink(@Req() req, @Query('userId') modifiedUserId: string): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      // this.logger.debug(modifiedUserId);
      if (!modifiedUserId || modifiedUserId.length === 0) {
        throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
      }

      modifiedUserId = modifiedUserId.replace(/ /g, '+');

      const user: User = req.user as User;
      if (user) {
        if (modifiedUserId !== user.id) {
          if (!user.local.isAdmin) {
            throw new HttpException('Not authorized', HttpStatus.UNAUTHORIZED);
          } else {
            this._userService
              .findById(modifiedUserId)
              .then((modifiedUser) => {
                if (modifiedUser) {
                  modifiedUser.facebook = {};
                  this._userService.saveUser(modifiedUser, true);
                  resolve({
                    user: this._userService.user2API(modifiedUser),
                  });
                } else {
                  throw new HttpException('User not found 1', HttpStatus.NOT_FOUND);
                }
              })
              .catch((reason) => {
                this.logger.error(reason);
                throw new HttpException('User not found 2', HttpStatus.NOT_FOUND);
              });
          }
        } else {
          user.facebook = {};
          this._userService.saveUser(user, true);
          resolve({
            user: this._userService.user2API(user),
            id_token: this._userService.createToken(user),
          });
        }
      } else {
        throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  }

  // =====================================
  // LOCAL ROUTES ========================
  // =====================================
  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(@Req() req): Promise<ApiReturn> {
    const user: User = req.user as User;
    if (user) {
      this._userService.updateLastConnection(user);

      const ret: ApiReturn = {
        id_token: this._userService.createToken(user),
      };

      return ret;
    } else {
      throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ====================================
  // route to get a new token (on user update)
  // ====================================
  //
  @Get('/user')
  @UseGuards(AuthGuard('jwt'))
  async getUser(@Req() req): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      const user: User = req.user as User;
      if (user) {
        const ret: ApiReturn = {};

        this._userService
          .findById(user.id)
          .then((loaderUser) => {
            ret.user = this._userService.user2API(loaderUser);
            resolve(ret);
          })
          .catch((err) => {
            this.logger.error(err);
            throw new HttpException('Authentication failed', HttpStatus.UNAUTHORIZED);
          });
      } else {
        throw new HttpException('Authentication failed', HttpStatus.UNAUTHORIZED);
      }
    });
  }

  // ====================================
  // route for processing the local signup form
  // ====================================
  //
  @Post('/signup')
  @HttpCode(201)
  @UseGuards(AuthGuard('local-signup'))
  async signup(@Req() req): Promise<ApiReturn> {
    const user: User = req.user as User;
    if (user) {
      this._userService.updateLastConnection(user);

      const ret: ApiReturn = {};
      ret.id_token = this._userService.createToken(user);

      return ret;
    } else {
      throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
