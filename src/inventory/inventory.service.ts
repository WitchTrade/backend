import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { InventoryUpdateDTO } from './dtos/update.dto';
import { Inventory } from './entities/inventory.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private _inventoryRepository: Repository<Inventory>,
    @InjectRepository(User)
    private _userRepository: Repository<User>,
  ) { }

  public async getInventory(uuid: string) {
    const user = await this._userRepository.findOne(uuid, { relations: ['inventory', 'inventory.inventoryItems', 'inventory.inventoryItems.item'] });
    if (!user) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!user.inventory) {
      throw new HttpException(
        `No inventory found for requested user.`,
        HttpStatus.NOT_FOUND,
      );
    }

    return user.inventory;
  }

  public async updateInventory(inventoryChange: InventoryUpdateDTO, uuid: string) {
    const user = await this._userRepository.findOne(uuid, { relations: ['inventory', 'inventory.inventoryItems', 'inventory.inventoryItems.item'] });
    if (!user) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!user.inventory) {
      throw new HttpException(
        `Please sync you inventory to update it.`,
        HttpStatus.NOT_FOUND,
      );
    }

    user.inventory.showInTrading = inventoryChange.showInTrading;

    await this._inventoryRepository.save(user.inventory);
    return user.inventory;
  }
}
