import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { ItemSet } from './entities/itemSet.entity';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private _itemRepository: Repository<Item>,
    @InjectRepository(ItemSet)
    private _itemSetRepository: Repository<ItemSet>,
  ) { }

  getAll(): Promise<Item[]> {
    return this._itemRepository.find({ relations: ['itemSets'] });
  }

  getSets(): Promise<ItemSet[]> {
    return this._itemSetRepository.find();
  }
}
