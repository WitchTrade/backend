import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from 'src/items/entities/item.entity';
import { Price } from 'src/markets/entities/price.entity';

import { Market } from '../markets/entities/market.entity';
import { SyncSettings } from './entities/syncSettings.entity';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, SyncSettings, Market, Price, Item])],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule { }
