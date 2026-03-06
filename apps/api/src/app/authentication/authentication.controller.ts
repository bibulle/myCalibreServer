import { ApiReturn, User } from '@my-calibre-server/api-interfaces';
import { Controller, Get, HttpCode, HttpException, Logger, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBadRequestException } from '../exceptions/api-bad-request.exception';
import { ApiInternalServerException } from '../exceptions/api-internal-server.exception';
import { ApiUnauthorizedException } from '../exceptions/api-unauthorized.exception';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
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
      throw new ApiInternalServerException('Authentication failed (google callback)');
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
      throw new ApiInternalServerException('Authentication failed (google id token)');
    }
  }

  @Get('google/unlink')
  @UseGuards(AuthGuard(['jwt']))
  async googleUnlink(@Req() req, @Query('userId') modifiedUserId: string): Promise<ApiReturn> {
    // this.logger.debug(modifiedUserId);
    if (!modifiedUserId || modifiedUserId.length === 0) {
      throw new ApiBadRequestException('User ID is required');
    }

    modifiedUserId = modifiedUserId.replace(/ /g, '+');

    const user: User = req.user as User;
    if (user) {
      if (modifiedUserId !== user.id) {
        if (!user.local.isAdmin) {
          throw new ApiUnauthorizedException('Not authorized to unlink another user');
        } else {
          try {
            const modifiedUser = await this._userService.findById(modifiedUserId);
            if (modifiedUser) {
              modifiedUser.google = {};
              await this._userService.saveUser(modifiedUser, true);
              return {
                user: this._userService.user2API(modifiedUser),
              };
            } else {
              throw new UserNotFoundException(modifiedUserId);
            }
          } catch (reason) {
            this.logger.error(reason);
            if (reason instanceof HttpException) {
              throw reason;
            }
            throw new UserNotFoundException(modifiedUserId);
          }
        }
      } else {
        user.google = {};
        await this._userService.saveUser(user, true);
        return {
          user: this._userService.user2API(user),
          id_token: this._userService.createToken(user),
        };
      }
    } else {
      throw new ApiInternalServerException('User session is missing');
    }
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
      throw new ApiInternalServerException('Authentication failed (facebook callback)');
    }
  }

  @Get('facebook/unlink')
  @UseGuards(AuthGuard(['jwt']))
  async facebookUnlink(@Req() req, @Query('userId') modifiedUserId: string): Promise<ApiReturn> {
    // this.logger.debug(modifiedUserId);
    if (!modifiedUserId || modifiedUserId.length === 0) {
      throw new ApiBadRequestException('User ID is required');
    }

    modifiedUserId = modifiedUserId.replace(/ /g, '+');

    const user: User = req.user as User;
    if (user) {
      if (modifiedUserId !== user.id) {
        if (!user.local.isAdmin) {
          throw new ApiUnauthorizedException('Not authorized to unlink another user');
        } else {
          try {
            const modifiedUser = await this._userService.findById(modifiedUserId);
            if (modifiedUser) {
              modifiedUser.facebook = {};
              await this._userService.saveUser(modifiedUser, true);
              return {
                user: this._userService.user2API(modifiedUser),
              };
            } else {
              throw new UserNotFoundException(modifiedUserId);
            }
          } catch (reason) {
            this.logger.error(reason);
            if (reason instanceof HttpException) {
              throw reason;
            }
            throw new UserNotFoundException(modifiedUserId);
          }
        }
      } else {
        user.facebook = {};
        await this._userService.saveUser(user, true);
        return {
          user: this._userService.user2API(user),
          id_token: this._userService.createToken(user),
        };
      }
    } else {
      throw new ApiInternalServerException('User session is missing');
    }
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
      throw new ApiInternalServerException('Local login failed');
    }
  }

  // ====================================
  // route to get a new token (on user update)
  // ====================================
  //
  @Get('/user')
  @UseGuards(AuthGuard('jwt'))
  async getUser(@Req() req): Promise<ApiReturn> {
    const user: User = req.user as User;
    if (user) {
      const ret: ApiReturn = {};

      try {
        const loaderUser = await this._userService.findById(user.id);
        ret.user = this._userService.user2API(loaderUser);
        return ret;
      } catch (err) {
        this.logger.error(err);
        throw new ApiUnauthorizedException('Authentication failed');
      }
    } else {
      throw new ApiUnauthorizedException('Authentication failed');
    }
  }

  // ====================================
  // route for processing the local signup form
  // ====================================
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
      throw new ApiInternalServerException('Signup failed');
    }
  }

  // ====================================
  // route for processing temporary token
  // ====================================
  @Post('checktoken')
  @UseGuards(AuthGuard('temporary-token'))
  async checkToken(@Req() req): Promise<ApiReturn> {
    const user: User = req.user as User;
    if (user) {
      this._userService.updateLastConnection(user);

      const ret: ApiReturn = {};
      ret.id_token = this._userService.createToken(user);

      return ret;
    } else {
      throw new ApiInternalServerException('Token check failed');
    }
  }
}
