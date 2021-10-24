import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { ScheduleModule } from '@nestjs/schedule';
import 'dotenv/config';

import { User } from './users/entities/user.entity';
import { AdminModule } from './admin/admin.module';
import { Role } from './users/entities/role.entity';
import { Badge } from './users/entities/badge.entity';
import { AdminLog } from './admin/entities/adminlog.entity';
import { ItemsModule } from './items/items.module';
import { Item } from './items/entities/item.entity';
import { ItemSet } from './items/entities/itemSet.entity';
import { GameserversModule } from './gameservers/gameservers.module';
import { NotificationsModule } from './notifications/notifications.module';
import { Notification } from './notifications/entities/notification.entity';
import { SyncSettings } from './users/entities/syncSettings.entity';
import { InventoryModule } from './inventory/inventory.module';
import { InventoryItem } from './inventory/entities/inventoryItem.entity';
import { Inventory } from './inventory/entities/inventory.entity';
import { SteamModule } from './steam/steam.module';
import { MarketsModule } from './markets/markets.module';
import { Market } from './markets/entities/market.entity';
import { Offer } from './markets/entities/offer.entity';
import { Wish } from './markets/entities/wish.entity';
import { Price } from './markets/entities/price.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASEHOST,
      port: parseInt(process.env.DATABASEPORT, 10),
      username: process.env.DATABASEUSER,
      password: process.env.DATABASEPW,
      database: 'witchtrade',
      entities: [
        User,
        Role,
        Badge,
        AdminLog,
        Item,
        ItemSet,
        Notification,
        SyncSettings,
        Inventory,
        InventoryItem,
        Market,
        Offer,
        Wish,
        Price,
      ],
      synchronize: true,
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    AdminModule,
    ItemsModule,
    GameserversModule,
    NotificationsModule,
    InventoryModule,
    SteamModule,
    MarketsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
