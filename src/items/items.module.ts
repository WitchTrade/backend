import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { ItemSet } from './entities/itemSet.entity';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';

@Module({
  imports: [TypeOrmModule.forFeature([Item, ItemSet])],
  controllers: [ItemsController],
  providers: [ItemsService]
})
export class ItemsModule {}
