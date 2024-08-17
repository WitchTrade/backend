import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { InventoryUpdateDTO } from './dtos/update.dto';
import { Inventory } from './entities/inventory.entity';
import { InventoryItem } from 'src/inventory/entities/inventoryItem.entity';
import { Badge } from 'src/users/entities/badge.entity';
import { Item } from 'src/items/entities/item.entity';
import {
  PreparedWitchItInventoryItem,
  WitchItService,
} from 'src/witchit/witchIt.service';

@Injectable()
export class InventoryService {
  private _inventoryCache = parseInt(process.env.INVENTORY_CACHETIME, 10);

  constructor(
    @InjectRepository(Inventory)
    private _inventoryRepository: Repository<Inventory>,
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    @InjectRepository(Item)
    private _itemRepository: Repository<Item>,
    @InjectRepository(InventoryItem)
    private _inventoryItemRepository: Repository<InventoryItem>,
    @InjectRepository(Badge)
    private _badgeRepository: Repository<Badge>,
    private _witchItService: WitchItService,
  ) {}

  public async getInventory(uuid: string) {
    const user = await this._userRepository.findOne(uuid, {
      relations: [
        'inventory',
        'inventory.inventoryItems',
        'inventory.inventoryItems.item',
      ],
    });
    if (!user) {
      throw new HttpException('User not found.', HttpStatus.BAD_REQUEST);
    }
    if (!user.inventory) {
      throw new HttpException(
        `No inventory found for requested user.`,
        HttpStatus.NOT_FOUND,
      );
    }

    return user.inventory;
  }

  public async updateInventory(
    inventoryChange: InventoryUpdateDTO,
    uuid: string,
  ) {
    const user = await this._userRepository.findOne(uuid, {
      relations: [
        'inventory',
        'inventory.inventoryItems',
        'inventory.inventoryItems.item',
      ],
    });
    if (!user) {
      throw new HttpException('User not found.', HttpStatus.BAD_REQUEST);
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

  public async syncInventory(uuid: string) {
    const user = await this._userRepository.findOne(uuid, {
      relations: ['inventory', 'badges'],
    });
    if (!user) {
      throw new HttpException('User not found.', HttpStatus.BAD_REQUEST);
    }

    const now = new Date();
    if (user.inventory) {
      const sinceLastSync = now.getTime() - user.inventory.lastSynced.getTime();
      if (sinceLastSync < this._inventoryCache) {
        const timeToWait = Math.ceil(
          (this._inventoryCache - sinceLastSync) / 1000,
        );
        throw new HttpException(
          `You need to wait ${Math.floor(timeToWait / 60)}:${(timeToWait % 60)
            .toFixed(0)
            .padStart(2, '0')} minute${
            timeToWait === 1 ? '' : 's'
          } to sync again.`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (
      !user.steamProfileLink ||
      !user.verifiedSteamProfileLink ||
      !user.witchItUserId
    ) {
      throw new HttpException(
        `You need to have a verified steam profile link to be able to sync your witch it inventory. Please configure one in your account settings.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const witchItInventory = (
      await this._witchItService.getWitchItInventory(user.witchItUserId)
    ).data;

    if (!witchItInventory.success) {
      throw new HttpException(
        `Failed to fetch inventory from Witch It.`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const preparedItems = this._witchItService.prepareInventoryItems(
      witchItInventory.entries,
    );

    if (!user.inventory) {
      const newInventory = new Inventory();
      newInventory.lastSynced = new Date();
      user.inventory = await this._inventoryRepository.save(newInventory);
      await this._userRepository.save(user);
    } else {
      user.inventory.lastSynced = new Date();
      await this._inventoryRepository.save(user.inventory);
    }

    await this._updateInventory(user.inventory, preparedItems);

    this._checkForCompleteCollection(user);

    return this._inventoryRepository.findOne(user.inventory.id, {
      relations: ['inventoryItems', 'inventoryItems.item'],
    });
  }

  private async _updateInventory(
    userInventory: Inventory,
    inventoryItems: PreparedWitchItInventoryItem[],
  ) {
    const items = await this._itemRepository.find();

    const updatedInventoryItems = await this._inventoryItemRepository.find({
      where: { inventory: userInventory },
      relations: ['item'],
    });
    for (const inventoryItem of inventoryItems) {
      if (updatedInventoryItems.some((ii) => ii.item.id === inventoryItem.id)) {
        const ii = updatedInventoryItems.find(
          (ii) => ii.item.id === inventoryItem.id,
        );
        if (ii.amount === inventoryItem.amount) {
          // remove item because the amount didn't change (Don't update it in the database)
          this._removeFromArray(updatedInventoryItems, ii);
        } else {
          ii.amount = inventoryItem.amount;
        }
      } else {
        const item = items.find((item) => item.id === inventoryItem.id);
        if (!item) {
          console.error(
            `Inventory item with id ${inventoryItem.id} not found in database.`,
          );
          continue;
        }
        const inventoryItemEntity = new InventoryItem();
        inventoryItemEntity.inventory = userInventory;
        inventoryItemEntity.amount = inventoryItem.amount;
        inventoryItemEntity.item = item;
        updatedInventoryItems.push(inventoryItemEntity);
      }
    }

    // save all inventory items
    await this._inventoryItemRepository.save(updatedInventoryItems);

    // remove items that aren't in the user's inv anymore
    const iiToRemove: InventoryItem[] = updatedInventoryItems.filter(
      (uii) => !inventoryItems.some((ii) => ii.id === uii.item.id),
    );
    await this._inventoryItemRepository.remove(iiToRemove);
  }

  private _removeFromArray(array: any[], object: any) {
    const index = array.indexOf(object);
    array[index] = array[array.length - 1];
    array.pop();
  }

  private async _checkForCompleteCollection(user: User) {
    const missingItemCount = (
      await this._itemRepository.query(
        `SELECT i.id FROM item as i ` +
          `where NOT EXISTS (SELECT ii."itemId" FROM inventory_item as ii where ii."inventoryId" = ${user.inventory.id} ` +
          `AND ii."itemId" = i.id) ` +
          `AND i."tagSlot" != 'ingredient' ` +
          `AND i."tagSlot" != 'recipe' ` +
          `AND i.tradeable = TRUE;`,
      )
    ).length;
    const totalItemCount = await this._itemRepository
      .createQueryBuilder('i')
      .where("i.tagSlot != 'ingredient'")
      .andWhere("i.tagSlot != 'recipe'")
      .andWhere('i.tradeable = TRUE')
      .getCount();

    const steps = [100, 75, 50, 25];

    const ownedPercent =
      ((totalItemCount - missingItemCount) / totalItemCount) * 100;

    const step = steps.find((s) => s <= ownedPercent);

    if (!step) {
      return;
    }

    const completionistBadgeId = `completionist${step}`;

    // User already has the desired completionist badge
    if (user.badges.some((b) => b.id === completionistBadgeId)) {
      return;
    }

    const completionistBadge = await this._badgeRepository.findOne(
      completionistBadgeId,
    );
    if (!completionistBadge) {
      console.error(`Completionist badge "${completionistBadgeId}" not found.`);
      return;
    }

    user.badges = user.badges.filter((b) => !b.id.startsWith('completionist'));

    user.badges.push(completionistBadge);
    this._userRepository.save(user);
  }
}
