import { Controller, Get } from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { GameserversService } from './gameservers.service';

@ApiTags('gameservers')
@Controller('gameservers')
export class GameserversController {
  constructor(private _gameserversService: GameserversService) { }

  @Get()
  getGameServers() {
    return this._gameserversService.getGameServers();
  }
}
