import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { EpicService } from 'src/oauth/epic.service';
import { AuthGuard } from '../guards/auth.guard';
import { UserDecorator } from '../users/decorators/user.decorator';
import { SteamService } from './steam.service';

@Controller('oauth')
export class OAuthController {
  constructor(
    private _steamService: SteamService,
    private _epicService: EpicService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('steam/login')
  steamLogin(@UserDecorator('id') uuid: string) {
    return this._steamService.login(uuid);
  }

  @UseGuards(AuthGuard)
  @Get('steam/auth')
  steamAuth(@Req() req: Request, @UserDecorator('id') uuid: string) {
    return this._steamService.auth(req, uuid);
  }

  @UseGuards(AuthGuard)
  @Get('epic/login')
  epicLogin(@UserDecorator('id') uuid: string) {
    return this._epicService.login(uuid);
  }

  @UseGuards(AuthGuard)
  @Get('epic/auth')
  epicAuth(@Req() req: Request, @UserDecorator('id') uuid: string) {
    return this._epicService.auth(req, uuid);
  }
}
