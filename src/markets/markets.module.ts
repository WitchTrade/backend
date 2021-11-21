import { Module } from '@nestjs/common';
import { MarketsService } from './markets.service';
import { MarketsController } from './markets.controller';
import { User } from '../users/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity';
import { Market } from './entities/market.entity';
import { OffersService } from './offers.service';
import { Item } from '../items/entities/item.entity';
import { Price } from './entities/price.entity';
import { Wish } from './entities/wish.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { WishesService } from './wishes.service';
import { Notification } from 'src/notifications/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Market, Offer, Wish, Item, Price, Notification]),
    NotificationsModule
  ],
  providers: [MarketsService, OffersService, WishesService],
  controllers: [MarketsController],
  exports: [OffersService]
})
export class MarketsModule { }
