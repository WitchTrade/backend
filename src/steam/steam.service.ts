import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Inventory } from '../inventory/entities/inventory.entity';
import { InventoryItem } from '../inventory/entities/inventoryItem.entity';
import { Item } from '../items/entities/item.entity';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { AbstractItem } from './models/abstractItem.model';
import { SteamItemAsset } from './models/steamItemAsset.model';
import { SteamItemDescription } from './models/steamItemDescription.model';
import { SteamFetcherService } from './steamFetcher.service';
import { Badge } from 'src/users/entities/badge.entity';

@Injectable()
export class SteamService {

  private _steamInvCacheTime = parseInt(process.env.STEAMINVCACHETIME, 10);

  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    @InjectRepository(Item)
    private _itemRepository: Repository<Item>,
    @InjectRepository(Inventory)
    private _inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryItem)
    private _inventoryItemRepository: Repository<InventoryItem>,
    @InjectRepository(Badge)
    private _badgeRepository: Repository<Badge>,
    private _steamFetcherService: SteamFetcherService
  ) { }

  public async syncInventory(uuid: string, autoSync?: boolean, failed?: any) {
    const user = await this._userRepository.findOne(uuid, { relations: ['inventory', 'badges'] });
    if (!user) {
      if (autoSync) {
        failed(true);
        return;
      }
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const now = new Date();
    if (user.inventory && !autoSync) {
      const sinceLastSync = now.getTime() - user.inventory.lastSynced.getTime();
      if (sinceLastSync < this._steamInvCacheTime) {
        throw new HttpException(
          `You need to wait ${Math.floor((this._steamInvCacheTime - sinceLastSync) / 1000 / 60)} minutes to sync again.`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (!user.steamProfileLink) {
      if (autoSync) {
        failed(true);
        return;
      }
      throw new HttpException(
        `No steam profile link set. Please configure one in your account settings.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const steamProfileId = await this._steamFetcherService.getSteamProfileId(user.steamProfileLink, autoSync, failed);

    const abstractItems = await this._getAbstractSteamItems(steamProfileId, autoSync, failed);

    const items = await this._itemRepository.find();

    const newInventoryItems: { item: Item, amount: number; }[] = [];
    abstractItems.forEach(ai => {
      // temporary fix for two invalid itemnames
      this._tempFixWrongItemNames(ai);
      const item = items.find((item) => item.name === ai.name && item.tagSlot === ai.tagSlot);
      // if weird stuff happens, this is being called
      if (!item) {
        console.error(`Item "${ai.name}" not found in WitchTrade database. Steam Profile Id: ${steamProfileId}`);
      } else {
        newInventoryItems.push({ item, amount: ai.amount });
      }
    });

    if (!user.inventory) {
      const newInventory = new Inventory();
      newInventory.lastSynced = new Date();
      user.inventory = await this._inventoryRepository.save(newInventory);
      await this._userRepository.save(user);
    } else {
      user.inventory.lastSynced = new Date();
      await this._inventoryRepository.save(user.inventory);
    }

    await this._updateInventory(user.inventory, newInventoryItems);

    if (user.verifiedSteamProfileLink) {
      this._checkForCompleteCollection(user);
    }

    return this._inventoryRepository.findOne(user.inventory.id, { relations: ['inventoryItems', 'inventoryItems.item'] });
  }

  private async _getAbstractSteamItems(steamProfileId: string, autoSync: boolean, failed: any): Promise<AbstractItem[]> {
    const descriptions: SteamItemDescription[] = [];
    const assets: SteamItemAsset[] = [];

    let moreItemsToFetch = true;
    let lastAssedId: string;

    while (moreItemsToFetch) {
      const response = await this._steamFetcherService.fetchInventoryPage(steamProfileId, lastAssedId, autoSync, failed);
      assets.push(...response.data.assets);
      descriptions.push(...response.data.descriptions.filter((d: SteamItemDescription) => !descriptions.find(description => description.classid === d.classid)));
      if (response.data.more_items) {
        lastAssedId = response.data.last_assetid;
        moreItemsToFetch = true;
      } else {
        moreItemsToFetch = false;
      }
    }

    let abstractItems = descriptions.map(description => {
      const amount = assets.filter(a => a.classid === description.classid).map(a => parseInt(a.amount, 10)).reduce((a, c) => a + c);

      return { name: description.name, amount, tagSlot: description.tags.find(t => t.category === 'slot').internal_name };
    });

    // remove possible duplicates
    abstractItems = [...new Map(abstractItems.map(ai => [JSON.stringify([ai.name, ai.tagSlot]), ai])).values()];

    return abstractItems;
  }

  private async _updateInventory(userInventory: Inventory, newInventoryItems: { item: Item, amount: number; }[]) {
    let updatedInventoryItems = await this._inventoryItemRepository.find({ where: { inventory: userInventory }, relations: ['item'] });
    for (const newInventoryItem of newInventoryItems) {
      if (updatedInventoryItems.some(ii => ii.item.id === newInventoryItem.item.id)) {
        const ii = updatedInventoryItems.find(ii => ii.item.id === newInventoryItem.item.id);
        if (ii.amount === newInventoryItem.amount) {
          // remove item because the amount didn't change (Don't update it in the database)
          this._removeFromArray(updatedInventoryItems, ii);
        } else {
          ii.amount = newInventoryItem.amount;
        }
      } else {
        const inventoryItemEntity = new InventoryItem();
        inventoryItemEntity.inventory = userInventory;
        inventoryItemEntity.amount = newInventoryItem.amount;
        inventoryItemEntity.item = newInventoryItem.item;

        updatedInventoryItems.push(inventoryItemEntity);
      }
    }

    // save all inventory items
    await this._inventoryItemRepository.save(updatedInventoryItems);

    // remove items that aren't in the user's inv anymore
    let iiToRemove: InventoryItem[] = updatedInventoryItems.filter(uii => !newInventoryItems.some(ii => ii.item.id === uii.item.id));
    await this._inventoryItemRepository.remove(iiToRemove);
  }

  private _removeFromArray(array: any[], object: any) {
    const index = array.indexOf(object);
    array[index] = array[array.length - 1];
    array.pop();
  }

  private _tempFixWrongItemNames(abstractItem: any) {
    if (abstractItem.name === 'Belly of the  Minty Gingerbreadman') {
      abstractItem.name = 'Belly of the Minty Gingerbreadman';
    }
    if (abstractItem.name === 'Legs of the  Minty Gingerbreadman') {
      abstractItem.name = 'Legs of the Minty Gingerbreadman';
    }
  }

  private async _checkForCompleteCollection(user: User) {
    const missingItemCount = (await this._itemRepository.query(
      `SELECT i.id FROM item as i ` +
      `where NOT EXISTS (SELECT ii.itemId FROM inventory_item as ii where ii.inventoryId = ${user.inventory.id} ` +
      `AND ii.itemId = i.id) ` +
      `AND i.tagSlot != 'ingredient' ` +
      `AND i.tagSlot != 'recipe' ` +
      `AND i.tradeable = 1;`
    )).length;
    const totalItemCount = await this._itemRepository.createQueryBuilder('i')
      .where('i.tagSlot != \'ingredient\'')
      .andWhere('i.tagSlot != \'recipe\'')
      .andWhere('i.tradeable = 1')
      .getCount();

    const steps = [100, 75, 50, 25];

    const ownedPercent = (totalItemCount - missingItemCount) / totalItemCount * 100;

    const step = steps.find(s => s <= ownedPercent);

    const completionistBadgeId = `completionist${step}`;

    // User already has the desired completionist badge
    if (user.badges.some(b => b.id === completionistBadgeId)) {
      return;
    }

    const completionistBadge = await this._badgeRepository.findOne(completionistBadgeId);
    if (!completionistBadge) {
      console.error(`Completionist badge "${completionistBadgeId}" not found.`);
      return;
    }

    user.badges = user.badges.filter(b => !b.id.startsWith('completionist'));

    user.badges.push(completionistBadge);
    this._userRepository.save(user);
  }

  public async getFriends(uuid: string) {
    const user = await this._userRepository.findOne(uuid);
    if (!user) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!user.steamProfileLink) {
      throw new HttpException(
        `No steam profile url set. Please configure one in your account settings.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const steamId = await this._steamFetcherService.getSteamProfileId(user.steamProfileLink);

    const friendIds = (await this._steamFetcherService.getSteamFriendIds(steamId)).data.friendslist.friends.map(friend => friend.steamid);
    let friendNames: string[] = [];

    let doneFetchingFriends = false;
    while (!doneFetchingFriends) {
      const request = await this._steamFetcherService.getSteamNamesfromIds(friendIds.splice(0, 100));
      const playerNames = request.data.response.players.map(player => player.personaname);
      friendNames.push(...playerNames);
      if (friendIds.length === 0) {
        doneFetchingFriends = true;
      }
    }
    friendNames = friendNames.map(friendName => friendName.substring(0, 20));

    // get own playername
    const request = await this._steamFetcherService.getSteamNamesfromIds([steamId]);
    const ownPlayer = request.data.response.players.map(player => player.personaname)[0].substring(0, 20);

    return { friends: friendNames, ownPlayer };
  }
}
