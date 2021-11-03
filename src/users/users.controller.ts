import { Body, Controller, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { UserDecorator } from './decorators/user.decorator';
import { UserChangePasswordDTO } from './dtos/changePassword.dto';

import { UserLoginDTO } from './dtos/login.dto';
import { UserRegisterDTO } from './dtos/register.dto';
import { UserUpdateDTO } from './dtos/update.dto';
import { SyncSettingsUpdateDTO } from './dtos/updateSyncSettings.dto';
import { SyncSettings } from './entities/syncSettings.entity';
import { PublicUser, User, UserWithToken } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private _usersService: UsersService) { }

  @Post('register')
  public register(@Body() user: UserRegisterDTO): Promise<UserWithToken> {
    return this._usersService.register(user);
  }

  @HttpCode(200)
  @Post('login')
  public login(@Body() user: UserLoginDTO): Promise<UserWithToken> {
    return this._usersService.login(user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('current')
  public getCurrentUser(@UserDecorator('id') uuid: string): Promise<User> {
    return this._usersService.getCurrentUser(uuid);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('syncsettings')
  public getSyncSettings(@UserDecorator('id') uuid: string): Promise<SyncSettings> {
    return this._usersService.getSyncSettings(uuid);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Put('syncsettings')
  public updateSyncSettings(@UserDecorator('id') uuid: string, @Body() data: SyncSettingsUpdateDTO): Promise<SyncSettings> {
    return this._usersService.updateSyncSettings(data, uuid);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Put('')
  public updateUser(@UserDecorator('id') uuid: string, @Body() data: UserUpdateDTO): Promise<UserWithToken> {
    return this._usersService.updateUser(data, uuid);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Put('password')
  public changePassword(@Body() data: UserChangePasswordDTO, @UserDecorator('id') uuid: string): Promise<UserWithToken> {
    return this._usersService.changePassword(data, uuid);
  }

  @Get('get/:username')
  public getPublicUser(@Param('username') username: string): Promise<PublicUser> {
    return this._usersService.getPublicUser(username);
  }
}
