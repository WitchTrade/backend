import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { UserDecorator } from '../users/decorators/user.decorator';
import { OfferCreateDTO } from './dtos/offerCreate.dto';
import { OfferSyncDTO } from './dtos/offerSync.dto';
import { OfferUpdateDTO } from './dtos/offerUpdate.dto';
import { MarketUpdateDTO } from './dtos/update.dto';
import { WishCreateDTO } from './dtos/wishCreate.dto';
import { WishUpdateDTO } from './dtos/wishUpdate.dto';
import { MarketsService } from './markets.service';
import { OffersService } from './offers.service';
import { WishesService } from './wishes.service';

@ApiTags('markets')
@Controller('markets')
export class MarketsController {
  constructor(
    private _marketsService: MarketsService,
    private _offersService: OffersService,
    private _wishesService: WishesService,
  ) { }

  @Get('')
  getMarkets() {
    return this._marketsService.getMarkets();
  }

  @UseGuards(AuthGuard)
  @Put('')
  editMarket(@Body() data: MarketUpdateDTO, @UserDecorator('id') uuid: string) {
    return this._marketsService.editMarket(data, uuid);
  }

  @UseGuards(AuthGuard)
  @Get('own')
  getOwnMarket(@UserDecorator('id') uuid: string) {
    return this._marketsService.getOwnMarket(uuid);
  }

  @Get('user/:username')
  getPublicMarket(@Param('username') username: string) {
    return this._marketsService.getPublicMarket(username);
  }

  @Get('prices')
  getPrices() {
    return this._marketsService.getPrices();
  }


  @UseGuards(AuthGuard)
  @Post('offers')
  createOffer(@Body() data: OfferCreateDTO, @UserDecorator('id') uuid: string) {
    return this._offersService.createOffer(data, uuid);
  }

  @UseGuards(AuthGuard)
  @Put('offers/:id')
  editOffer(@Param('id') id: number, @Body() data: OfferUpdateDTO, @UserDecorator('id') uuid: string) {
    return this._offersService.editOffer(id, data, uuid);
  }

  @UseGuards(AuthGuard)
  @Delete('offers/:id')
  deleteOffer(@Param('id') id: number, @UserDecorator('id') uuid: string) {
    return this._offersService.deleteOffer(id, uuid);
  }

  @UseGuards(AuthGuard)
  @Delete('offers')
  deleteAllOffers(@UserDecorator('id') uuid: string) {
    return this._offersService.deleteAllOffers(uuid);
  }

  @UseGuards(AuthGuard)
  @Patch('offers')
  syncOffers(@Body() data: OfferSyncDTO, @UserDecorator('id') uuid: string) {
    return this._offersService.syncOffers(data, uuid);
  }


  @UseGuards(AuthGuard)
  @Post('wishes')
  createWish(@Body() data: WishCreateDTO, @UserDecorator('id') uuid: string) {
    return this._wishesService.createWish(data, uuid);
  }

  @UseGuards(AuthGuard)
  @Put('wishes/:id')
  editWish(@Param('id') id: number, @Body() data: WishUpdateDTO, @UserDecorator('id') uuid: string) {
    return this._wishesService.editWish(id, data, uuid);
  }

  @UseGuards(AuthGuard)
  @Delete('wishes/:id')
  deleteWish(@Param('id') id: number, @UserDecorator('id') uuid: string) {
    return this._wishesService.deleteWish(id, uuid);
  }
}
