import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private _statsService: StatsService) { }

  @Get('version')
  getVersion() {
    return this._statsService.getVersion();
  }

  @Get('witchtrade')
  getWitchTradeStats() {
    return this._statsService.getWitchTradeStats();
  }

  @Get('witchitserver')
  getWitchItServerStats() {
    return this._statsService.getWitchItServerStats();
  }
}
