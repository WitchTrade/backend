import { Controller, Get } from '@nestjs/common';
import { GameserversService } from './gameservers.service';

@Controller('gameservers')
export class GameserversController {
  constructor(private _gameserversService: GameserversService) { }

  @Get()
  getGameServers() {
    return this._gameserversService.getGameServers();
  }
}
