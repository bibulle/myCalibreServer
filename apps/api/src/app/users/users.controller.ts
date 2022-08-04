import { ApiReturn, User } from '@my-calibre-server/api-interfaces';
import { Body, Controller, Get, HttpException, HttpStatus, InternalServerErrorException, Logger, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  readonly logger = new Logger(UsersController.name);

  constructor(private _userService: UsersService) {}

  // =====================================
  // route to gat all user
  // =====================================
  @Get('/')
  @UseGuards(AuthGuard('jwt-admin'))
  async getAll(): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      this._userService
        .getAll()
        .then((users) => {
          const ret: ApiReturn = {};
          ret.users = users.map((u) => this._userService.user2API(u));

          resolve(ret);
        })
        .catch((err) => {
          this.logger.error(err);
          throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });
  }

  // =====================================
  // route to get logged user ============
  // =====================================
  @Get('/me')
  @UseGuards(AuthGuard('jwt'))
  async login(@Req() req): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      const userReq: User = req.user as User;

      this._userService
        .findById(userReq.id)
        .then((user) => {
          const ret: ApiReturn = {};
          ret.user = this._userService.user2API(user);

          resolve(ret);
        })
        .catch((err) => {
          this.logger.error(err);
          throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });
  }
  // =====================================
  // route to save a user ================
  // =====================================
  @Post('/save')
  @UseGuards(AuthGuard('jwt'))
  async save(@Req() req, @Body() body): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      const connectedUser = this._userService.createUser(req.user);

      if (!body?.user?.id) {
        throw new HttpException('Something go wrong', HttpStatus.BAD_REQUEST);
      }

      const savedUser = this._userService.createUser(body.user);
      // this.logger.debug(JSON.stringify(connectedUser, null,2));
      // this.logger.debug(JSON.stringify(savedUser, null,2));

      // modifying myself or i'm an admin, save it (else Not authorized)
      if (connectedUser.id !== savedUser.id && connectedUser.local.isAdmin !== true) {
        throw new HttpException('Not authorize to modify this user', HttpStatus.UNAUTHORIZED);
      }

      // try to becom an admin, reject
      if (connectedUser.id === savedUser.id && connectedUser.local.isAdmin === false && savedUser.local.isAdmin === true) {
        throw new HttpException('Mouarf !!!', HttpStatus.UNAUTHORIZED);
      }

      this.logger.debug(`Saving user ${savedUser.local.username} : ${savedUser.local.firstname} ${savedUser.local.lastname}`);

      this._userService
        .saveUser(savedUser, true)
        .then((user) => {
          resolve({ user: this._userService.user2API(user) });
        })
        .catch((err) => {
          this.logger.error(err);
          throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });
  }
  // =====================================
  // route to delete a user ================
  // =====================================
  @Post('/delete')
  @UseGuards(AuthGuard('jwt-admin'))
  async delete(@Req() req, @Body() body): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      const connectedUser = this._userService.createUser(req.user);

      if (!body?.userId) {
        throw new HttpException('Something go wrong', HttpStatus.BAD_REQUEST);
      }

      const userId = body.userId;

      // i'm an admin, delete it (else Not authorized)
      if (connectedUser.local.isAdmin !== true) {
        throw new HttpException('Not authorize to delete this user', HttpStatus.UNAUTHORIZED);
      }

      this.logger.debug(`Deleting user ${userId}`);

      this._userService
        .deleteUser(userId)
        .then(() => {
          resolve({});
        })
        .catch((err) => {
          this.logger.error(err);
          throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });
  }
  // =====================================
  // route to reset password of a user ===
  // =====================================
  @Post('/reset')
  @UseGuards(AuthGuard('jwt-admin'))
  async resetpassword(@Req() req, @Body() body): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      const connectedUser = this._userService.createUser(req.user);

      if (!body?.userId) {
        throw new HttpException('Something go wrong', HttpStatus.BAD_REQUEST);
      }

      const userId = body.userId;

      // i'm an admin, delete it (else Not authorized)
      if (connectedUser.local.isAdmin !== true) {
        throw new HttpException('Not authorize to modify this user', HttpStatus.UNAUTHORIZED);
      }

      this.logger.debug(`Reset password fo user ${userId}`);

      this._userService
        .resetUserPassword(userId)
        .then((newPassword) => {
          resolve({ newPassword: newPassword });
        })
        .catch((err) => {
          this.logger.error(err);
          throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });
  }
  // =====================================
  // route to change password of a user ===
  // =====================================
  @Post('/changepw')
  @UseGuards(AuthGuard('jwt'))
  async changepassword(@Req() req, @Body() body): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      const connectedUser = this._userService.createUser(req.user);

      if (!body?.password) {
        throw new HttpException('Something go wrong', HttpStatus.BAD_REQUEST);
      }

      const password = body.password;

      this.logger.debug(`Change password fo user ${connectedUser.local.username}`);

      this._userService
        .changeUserPassword(connectedUser.id, password)
        .then((user) => {
          // this.logger.debug(user);
          resolve({ ok: "Password changed", user: user});
        }) 
        .catch((err) => {
          this.logger.error(err);
          throw new HttpException('Something go wrong', HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });
  }
  // =====================================
  // route to merge users              ===
  // =====================================
  @Post('/merge')
  @UseGuards(AuthGuard('jwt-admin'))
  async mergeUsers(@Req() req, @Body() body): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      const connectedUser = this._userService.createUser(req.user);

      if (!body?.userSrcId || !body?.userTrgId) {
        throw new HttpException('Something go wrong', HttpStatus.BAD_REQUEST);
      }

      const userSrcId = body.userSrcId;
      const userTrgId = body.userTrgId;

      // i'm an admin, delete it (else Not authorized)
      if (connectedUser.local.isAdmin !== true) {
        throw new UnauthorizedException('Not authorize to modify those users');
      }

      this.logger.debug(`Merge some users`);

      this._userService
        .mergeUsers(userSrcId, userTrgId)
        .then(() => {
          this._userService
            .getAll()
            .then((users) => {
              resolve({ users: users });
            })
            .catch((err) => {
              this.logger.error(err);
              throw new InternalServerErrorException('Something go wrong');
            });
        })
        .catch((err) => {
          this.logger.error(err);
          throw new InternalServerErrorException('Something go wrong');
        });
    });
  }
}
