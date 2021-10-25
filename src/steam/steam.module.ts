import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketsModule } from '../markets/markets.module';
import { Inventory } from '../inventory/entities/inventory.entity';
import { InventoryItem } from '../inventory/entities/inventoryItem.entity';
import { Item } from '../items/entities/item.entity';
import { SyncSettings } from '../users/entities/syncSettings.entity';
import { User } from '../users/entities/user.entity';
import { SteamController } from './steam.controller';
import { SteamService } from './steam.service';
import { SteamAutoSyncService } from './steamAutoSync.service';
import { SteamFetcherService } from './steamFetcher.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Item, Inventory, InventoryItem, SyncSettings]),
    HttpModule,
    MarketsModule
  ],
  controllers: [SteamController],
  providers: [SteamService, SteamFetcherService, SteamAutoSyncService]
})
export class SteamModule { }
