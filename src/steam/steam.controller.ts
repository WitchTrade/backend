import { Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../guards/auth.guard';
import { UserDecorator } from '../users/decorators/user.decorator';
import { SteamService } from './steam.service';
import { SteamAuthService } from './steamAuth.service';

@Controller('steam')
export class SteamController {
  constructor(
    private _steamService: SteamService,
    private _steamAuthService: SteamAuthService
  ) { }

  @UseGuards(AuthGuard)
  @Patch('inventory')
  syncInventory(@UserDecorator('id') uuid: string) {
    return this._steamService.syncInventory(uuid);
  }

  @UseGuards(AuthGuard)
  @Get('friends')
  getFriends(@UserDecorator('id') uuid: string) {
    return this._steamService.getFriends(uuid);
  }

  @UseGuards(AuthGuard)
  @Get('login')
  login(@UserDecorator('id') uuid: string) {
    return this._steamAuthService.login(uuid);
  }

  @UseGuards(AuthGuard)
  @Get('auth')
  auth(@Req() req: Request, @UserDecorator('id') uuid: string) {
    return this._steamAuthService.auth(req, uuid);
  }
}
