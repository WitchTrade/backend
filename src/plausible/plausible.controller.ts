import {
  CacheInterceptor,
  CacheTTL,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { PlausibleService } from './plausible.service';
import { Request, Response } from 'express';

@Controller('blue')
export class PlausibleController {
  constructor(private _plausibleService: PlausibleService) {}

  @Get('script.js')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1000 * 60 * 60 * 24)
  getScript(@Res() response: Response) {
    return this._plausibleService.getScript(response);
  }

  @Post('event')
  @HttpCode(202)
  postEvent(@Req() request: Request) {
    return this._plausibleService.postEvent(request);
  }
}
