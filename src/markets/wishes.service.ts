import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from '../items/entities/item.entity';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { Market } from './entities/market.entity';
import { Price } from './entities/price.entity';
import { Wish } from './entities/wish.entity';
import { WishCreateDTO } from './dtos/wishCreate.dto';
import { WishUpdateDTO } from './dtos/wishUpdate.dto';

@Injectable()
export class WishesService {

  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    @InjectRepository(Market)
    private _marketRepository: Repository<Market>,
    @InjectRepository(Wish)
    private _wishRepository: Repository<Wish>,
    @InjectRepository(Item)
    private _itemRepository: Repository<Item>,
    @InjectRepository(Price)
    private _priceRepository: Repository<Price>,
  ) { }

  public async createWish(data: WishCreateDTO, uuid: string) {
    const user = await this._userRepository.findOne(uuid, { relations: ['market'] });
    if (!user) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!user.market) {
      throw new HttpException(
        'User has no market.',
        HttpStatus.NOT_FOUND,
      );
    }

    const existingWish = await this._wishRepository.findOne({ where: { item: { id: data.itemId }, market: user.market }, relations: ['item', 'market'] });
    if (existingWish) {
      throw new HttpException(
        'Item is already an wish',
        HttpStatus.BAD_REQUEST,
      );
    }

    const item = await this._itemRepository.findOne(data.itemId);
    if (!item || !item.tradeable) {
      throw new HttpException(
        'Item not found or is not tradeable',
        HttpStatus.NOT_FOUND,
      );
    }

    const mainPrice = await this._priceRepository.findOne(data.mainPriceId);
    if (!mainPrice) {
      throw new HttpException(
        `Main price with id "${data.mainPriceId}" not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    let secondaryPrice: Price;
    if (data.secondaryPriceId) {
      secondaryPrice = await this._priceRepository.findOne(data.secondaryPriceId);
      if (!secondaryPrice) {
        throw new HttpException(
          `Secondary price with id "${data.secondaryPriceId}" not found.`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    const wish = new Wish();

    wish.market = user.market;
    wish.item = item;
    wish.mainPrice = mainPrice;
    if (mainPrice.withAmount) {
      if (!data.mainPriceAmount) {
        throw new HttpException(
          `Main price "${mainPrice.priceKey}" needs price amount.`,
          HttpStatus.NOT_FOUND,
        );
      }
      wish.mainPriceAmount = data.mainPriceAmount;
    }
    if (secondaryPrice) {
      if (mainPrice.id === secondaryPrice.id) {
        throw new HttpException(
          `Main and secondary price can't be the same.`,
          HttpStatus.NOT_FOUND,
        );
      }
      wish.secondaryPrice = secondaryPrice;
      if (secondaryPrice.withAmount) {
        if (!data.secondaryPriceAmount) {
          throw new HttpException(
            `Secondary price "${secondaryPrice.priceKey}" needs price amount.`,
            HttpStatus.NOT_FOUND,
          );
        }
        wish.secondaryPriceAmount = data.secondaryPriceAmount;
      }
    }

    const createdWish = await this._wishRepository.save(wish);

    await this._setLastUpdated(user.market);

    return createdWish;
  }

  public async editWish(id: number, data: WishUpdateDTO, uuid: string) {
    const wish = await this._wishRepository.findOne(id, { relations: ['item', 'mainPrice', 'secondaryPrice', 'market', 'market.user'] });
    if (!wish) {
      throw new HttpException(
        'Wishlist item not found.',
        HttpStatus.NOT_FOUND,
      );
    }
    if (wish.market.user.id !== uuid) {
      throw new HttpException(
        'You do not own this wishlist item.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (wish.mainPrice.id !== data.mainPriceId) {
      const mainPrice = await this._priceRepository.findOne(data.mainPriceId);
      if (!mainPrice) {
        throw new HttpException(
          `Main price with id "${data.mainPriceId}" not found.`,
          HttpStatus.NOT_FOUND,
        );
      }
      wish.mainPrice = mainPrice;
    }
    if (wish.mainPrice.withAmount) {
      if (!data.mainPriceAmount) {
        throw new HttpException(
          `Main price "${wish.mainPrice.priceKey}" needs price amount.`,
          HttpStatus.NOT_FOUND,
        );
      }
      wish.mainPriceAmount = data.mainPriceAmount;
    } else {
      wish.mainPriceAmount = null;
    }

    if (data.secondaryPriceId && wish.mainPrice.id !== data.secondaryPriceId) {
      const secondaryPrice = await this._priceRepository.findOne(data.secondaryPriceId);
      if (!secondaryPrice) {
        throw new HttpException(
          `Secondary price with id "${data.secondaryPriceId}" not found.`,
          HttpStatus.NOT_FOUND,
        );
      }
      wish.secondaryPrice = secondaryPrice;
    } else if (!data.secondaryPriceId) {
      wish.secondaryPrice = null;
    }
    if (wish.secondaryPrice && wish.secondaryPrice.withAmount) {
      if (!data.secondaryPriceAmount) {
        throw new HttpException(
          `Secondary price "${wish.secondaryPrice.priceKey}" needs price amount.`,
          HttpStatus.NOT_FOUND,
        );
      }
      wish.secondaryPriceAmount = data.secondaryPriceAmount;
    } else {
      wish.secondaryPriceAmount = null;
    }

    const updatedWish = await this._wishRepository.save(wish);

    await this._setLastUpdated(wish.market);

    return updatedWish;
  }

  public async deleteWish(id: number, uuid: string) {
    const wish = await this._wishRepository.findOne(id, { relations: ['market', 'market.user'] });
    if (!wish) {
      throw new HttpException(
        'Wishlist item not found.',
        HttpStatus.NOT_FOUND,
      );
    }
    if (wish.market.user.id !== uuid) {
      throw new HttpException(
        'You do not own this wishlist item.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this._wishRepository.remove(wish);

    this._setLastUpdated(wish.market);

    return;
  }

  private async _setLastUpdated(market: Market) {
    if (market.user) {
      delete market.user;
    }
    market.lastUpdated = new Date();
    await this._marketRepository.update(market.id, market);
  }
}
