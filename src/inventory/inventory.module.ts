import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItem } from 'src/inventory/entities/inventoryItem.entity';
import { Item } from 'src/items/entities/item.entity';
import { Badge } from 'src/users/entities/badge.entity';
import { WitchItModule } from 'src/witchit/witchit.module';
import { User } from '../users/entities/user.entity';
import { Inventory } from './entities/inventory.entity';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventory, User, Item, InventoryItem, Badge]),
    WitchItModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
