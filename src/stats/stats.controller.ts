import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private _statsService: StatsService) {}

  @Get('version')
  getVersion() {
    return this._statsService.getVersion();
  }

  @Get('witchtrade')
  getWitchTradeStats() {
    return this._statsService.getWitchTradeStats();
  }
}
