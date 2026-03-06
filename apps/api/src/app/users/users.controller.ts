import { ApiReturn, User } from '@my-calibre-server/api-interfaces';
import { Body, Controller, Get, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBadRequestException } from '../exceptions/api-bad-request.exception';
import { ApiInternalServerException } from '../exceptions/api-internal-server.exception';
import { ApiUnauthorizedException } from '../exceptions/api-unauthorized.exception';
import { MailService } from '../utils/mail.service';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  readonly logger = new Logger(UsersController.name);

  constructor(private _userService: UsersService, private _mailService: MailService) {}

  // =====================================
  // route to gat all user
  // =====================================
  @Get('/')
  @UseGuards(AuthGuard('jwt-admin'))
  async getAll(): Promise<ApiReturn> {
    try {
      const users = await this._userService.getAll();
      const ret: ApiReturn = {};
      ret.users = users.map((u) => this._userService.user2API(u));
      return ret;
    } catch (err) {
      this.logger.error(err);
      throw new ApiInternalServerException('Unable to retrieve users');
    }
  }

  // =====================================
  // route to get logged user ============
  // =====================================
  @Get('/me')
  @UseGuards(AuthGuard('jwt'))
  async login(@Req() req): Promise<ApiReturn> {
    try {
      const userReq: User = req.user as User;
      const user = await this._userService.findById(userReq.id);
      const ret: ApiReturn = {};
      ret.user = this._userService.user2API(user);
      return ret;
    } catch (err) {
      this.logger.error(err);
      throw new ApiInternalServerException('Unable to retrieve current user');
    }
  }
  // =====================================
  // route to save a user ================
  // =====================================
  @Post('/save')
  @UseGuards(AuthGuard('jwt'))
  async save(@Req() req, @Body() body): Promise<ApiReturn> {
    const connectedUser = this._userService.createUser(req.user);

    if (!body?.user?.id) {
      throw new ApiBadRequestException('User ID is required');
    }

    const savedUser = this._userService.createUser(body.user);

    // modifying myself or i'm an admin, save it (else Not authorized)
    if (connectedUser.id !== savedUser.id && connectedUser.local.isAdmin !== true) {
      throw new ApiUnauthorizedException('Not authorized to modify this user');
    }

    // try to become an admin, reject
    if (connectedUser.id === savedUser.id && connectedUser.local.isAdmin === false && savedUser.local.isAdmin === true) {
      throw new ApiUnauthorizedException('Cannot self-elevate to admin');
    }

    this.logger.debug(`Saving user ${savedUser.local.username} : ${savedUser.local.firstname} ${savedUser.local.lastname}`);

    try {
      // try to get users (pasword and hash should be retrieve)
      const alreadySAveduser = await this._userService.findById(savedUser.id);
      savedUser.local.salt = alreadySAveduser.local.salt;
      savedUser.local.hashedPassword = alreadySAveduser.local.hashedPassword;

      // this.logger.debug(JSON.stringify(savedUser));
      // this.logger.debug(JSON.stringify(connectedUser));

      const user = await this._userService.saveUser(savedUser, true);
      return { user: this._userService.user2API(user) };
    } catch (err) {
      this.logger.error(err);
      throw new ApiInternalServerException('Unable to save user');
    }
  }
  // =====================================
  // route to delete a user ================
  // =====================================
  @Post('/delete')
  @UseGuards(AuthGuard('jwt-admin'))
  async delete(@Req() req, @Body() body): Promise<ApiReturn> {
    const connectedUser = this._userService.createUser(req.user);

    if (!body?.userId) {
      throw new ApiBadRequestException('User ID is required');
    }

    const userId = body.userId;

    // i'm an admin, delete it (else Not authorized)
    if (connectedUser.local.isAdmin !== true) {
      throw new ApiUnauthorizedException('Not authorized to delete this user');
    }

    this.logger.debug(`Deleting user ${userId}`);

    try {
      await this._userService.deleteUser(userId);
      return {};
    } catch (err) {
      this.logger.error(err);
      throw new ApiInternalServerException('Unable to delete user');
    }
  }
  // =====================================
  // route to reset password of a user ===
  // =====================================
  @Post('/reset')
  @UseGuards(AuthGuard('jwt-admin'))
  async resetpassword(@Req() req, @Body() body): Promise<ApiReturn> {
    // return new Promise<ApiReturn>((resolve) => {

    const connectedUser = this._userService.createUser(req.user);

    if (!body?.userId) {
      throw new ApiBadRequestException('User ID is required');
    }

    const userId = body.userId;

    // i'm an admin, delete it (else Not authorized)
    if (connectedUser.local.isAdmin !== true) {
      throw new ApiUnauthorizedException('Not authorized to modify this user');
    }

    this.logger.debug(`Reset password fo user ${connectedUser.local.firstname} ${connectedUser.local.lastname}`);

    try {
      await this._userService.resetUserPassword(userId);
      return { ok: 'mail sent' };
    } catch (err) {
      this.logger.error(err);
      throw new ApiInternalServerException(typeof err === 'string' ? err : 'Unable to reset user password');
    }
    // });
  }
  // =====================================
  // route to change password of a user ===
  // =====================================
  @Post('/changepw')
  @UseGuards(AuthGuard('jwt'))
  async changepassword(@Req() req, @Body() body): Promise<ApiReturn> {
    const connectedUser = this._userService.createUser(req.user);

    if (!body?.password) {
      throw new ApiBadRequestException('Password is required');
    }

    const password = body.password;

    this.logger.debug(`Change password fo user ${connectedUser.local.username}`);

    try {
      const user = await this._userService.changeUserPassword(connectedUser.id, password);
      // this.logger.debug(user);
      return { ok: 'Password changed', user: user };
    } catch (err) {
      this.logger.error(err);
      throw new ApiInternalServerException('Unable to change password');
    }
  }
  // =====================================
  // route to merge users              ===
  // =====================================
  @Post('/merge')
  @UseGuards(AuthGuard('jwt-admin'))
  async mergeUsers(@Req() req, @Body() body): Promise<ApiReturn> {
    const connectedUser = this._userService.createUser(req.user);

    if (!body?.userSrcId || !body?.userTrgId) {
      throw new ApiBadRequestException('Source user ID and target user ID are required');
    }

    const userSrcId = body.userSrcId;
    const userTrgId = body.userTrgId;

    // i'm an admin, delete it (else Not authorized)
    if (connectedUser.local.isAdmin !== true) {
      throw new ApiUnauthorizedException('Not authorized to merge users');
    }

    this.logger.debug(`Merge some users`);

    try {
      await this._userService.mergeUsers(userSrcId, userTrgId);
      const users = await this._userService.getAll();
      return { users: users };
    } catch (err) {
      this.logger.error(err);
      throw new ApiInternalServerException('Unable to merge users');
    }
  }
}
