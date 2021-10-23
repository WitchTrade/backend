import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { UserDecorator } from '../users/decorators/user.decorator';
import { SteamService } from './steam.service';

@ApiTags('steam')
@Controller('steam')
export class SteamController {
  constructor(private _steamService: SteamService) { }

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
}
