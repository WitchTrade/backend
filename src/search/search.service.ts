import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Offer } from '../markets/entities/offer.entity';
import { Wish } from '../markets/entities/wish.entity';
import { getRecipeOfItemId } from '../static/itemIdToRecipeId';
import { User } from '../users/entities/user.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SearchDTO } from './dtos/search.dto';

enum QUERYTYPE {
  OFFERS,
  WISHES,
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    @InjectRepository(Offer)
    private _offerRepository: Repository<Offer>,
    @InjectRepository(Wish)
    private _wishRepository: Repository<Wish>,
  ) {}

  public async search(data: SearchDTO, uuid?: string) {
    const tempOffers = (await this._searchQuery(
      QUERYTYPE.OFFERS,
      data,
      uuid,
    )) as Offer[];
    const offers = [];
    for (const tempOffer of tempOffers) {
      const existingOffer = offers.find((o) => o.id === tempOffer.item.id);
      if (existingOffer) {
        existingOffer.markets.push({
          quantity: tempOffer.quantity,
          mainPrice: tempOffer.mainPrice,
          mainPriceAmount: tempOffer.mainPriceAmount,
          wantsBoth: tempOffer.wantsBoth,
          secondaryPrice: tempOffer.secondaryPrice,
          secondaryPriceAmount: tempOffer.secondaryPriceAmount,
          user: {
            username: tempOffer.market.user.username,
            displayName: tempOffer.market.user.displayName,
            verified: tempOffer.market.user.verified,
          },
        });
      } else {
        offers.push({
          id: tempOffer.item.id,
          markets: [
            {
              quantity: tempOffer.quantity,
              mainPrice: tempOffer.mainPrice,
              mainPriceAmount: tempOffer.mainPriceAmount,
              wantsBoth: tempOffer.wantsBoth,
              secondaryPrice: tempOffer.secondaryPrice,
              secondaryPriceAmount: tempOffer.secondaryPriceAmount,
              user: {
                username: tempOffer.market.user.username,
                displayName: tempOffer.market.user.displayName,
                verified: tempOffer.market.user.verified,
              },
            },
          ],
        });
      }
    }

    const tempWishes = await this._searchQuery(QUERYTYPE.WISHES, data, uuid);
    const wishes = [];
    for (const tempWish of tempWishes) {
      const existingWish = wishes.find((o) => o.id === tempWish.item.id);
      if (existingWish) {
        existingWish.markets.push({
          mainPrice: tempWish.mainPrice,
          mainPriceAmount: tempWish.mainPriceAmount,
          wantsBoth: tempWish.wantsBoth,
          secondaryPrice: tempWish.secondaryPrice,
          secondaryPriceAmount: tempWish.secondaryPriceAmount,
          user: {
            username: tempWish.market.user.username,
            displayName: tempWish.market.user.displayName,
            verified: tempWish.market.user.verified,
          },
        });
      } else {
        wishes.push({
          id: tempWish.item.id,
          markets: [
            {
              mainPrice: tempWish.mainPrice,
              mainPriceAmount: tempWish.mainPriceAmount,
              wantsBoth: tempWish.wantsBoth,
              secondaryPrice: tempWish.secondaryPrice,
              secondaryPriceAmount: tempWish.secondaryPriceAmount,
              user: {
                username: tempWish.market.user.username,
                displayName: tempWish.market.user.displayName,
                verified: tempWish.market.user.verified,
              },
            },
          ],
        });
      }
    }

    return { offers, wishes };
  }

  private async _searchQuery(
    type: QUERYTYPE,
    data: SearchDTO,
    uuid?: string,
  ): Promise<Offer[] | Wish[]> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    let query: SelectQueryBuilder<Offer> | SelectQueryBuilder<Wish>;
    if (type === QUERYTYPE.OFFERS) {
      query = this._offerRepository
        .createQueryBuilder('offer')
        .select([
          'offer.id',
          'offer.quantity',
          'offer.mainPriceAmount',
          'offer.wantsBoth',
          'offer.secondaryPriceAmount',
        ])
        .leftJoin('offer.mainPrice', 'mainPrice')
        .addSelect('mainPrice.priceKey')
        .leftJoin('offer.secondaryPrice', 'secondaryPrice')
        .addSelect('secondaryPrice.priceKey')
        .leftJoin('offer.market', 'market')
        .addSelect('market.id')
        .leftJoin('market.user', 'user')
        .addSelect(['user.username', 'user.displayName', 'user.verified'])
        .leftJoin('offer.item', 'item')
        .addSelect('item.id')
        .where(
          'offer.quantity > 0 AND user.hidden = FALSE AND user.banned = FALSE AND market.lastUpdated > :oneMonthAgo',
          { oneMonthAgo },
        );
    } else {
      query = this._wishRepository
        .createQueryBuilder('wish')
        .select([
          'wish.id',
          'wish.mainPriceAmount',
          'wish.wantsBoth',
          'wish.secondaryPriceAmount',
        ])
        .leftJoin('wish.mainPrice', 'mainPrice')
        .addSelect('mainPrice.priceKey')
        .leftJoin('wish.secondaryPrice', 'secondaryPrice')
        .addSelect('secondaryPrice.priceKey')
        .leftJoin('wish.market', 'market')
        .addSelect('market.id')
        .leftJoin('market.user', 'user')
        .addSelect(['user.username', 'user.displayName', 'user.verified'])
        .leftJoin('wish.item', 'item')
        .addSelect('item.id')
        .where(
          'user.hidden = FALSE AND user.banned = FALSE AND market.lastUpdated > :oneMonthAgo',
          { oneMonthAgo },
        );
    }

    if (data.itemId) {
      const recipeId = getRecipeOfItemId(data.itemId);
      const properties = [':itemId'];
      if (recipeId) {
        properties.push(':recipeId');
      }
      query.andWhere(this._whereString('id', '=', properties), {
        itemId: data.itemId,
        recipeId,
      });
    }

    if (data.character !== 'any') {
      const noneCharacter = data.character === 'none';
      query.andWhere(
        this._whereString('tagCharacter', noneCharacter ? 'IS' : '=', [
          noneCharacter ? 'NULL' : ':character',
        ]),
        { character: data.character },
      );
    }

    if (data.slot !== 'any') {
      query.andWhere(this._whereString('tagSlot', '=', [':slot']), {
        slot: data.slot,
      });
    }

    if (data.event !== 'any') {
      const noneEvent = data.event === 'none';
      query.andWhere(
        this._whereString('tagEvent', noneEvent ? 'IS' : '=', [
          noneEvent ? 'NULL' : ':event',
        ]),
        { event: data.event },
      );
    }

    if (data.rarity !== 'any') {
      query.andWhere(this._whereString('tagRarity', '=', [':rarity']), {
        rarity: data.rarity,
      });
    }

    if (uuid) {
      const user = await this._userRepository.findOne(uuid, {
        relations: [
          'inventory',
          'inventory.inventoryItems',
          'inventory.inventoryItems.item',
          'market',
          'market.wishes',
          'market.wishes.item',
        ],
      });
      if (data.inventoryType !== 'any') {
        if (!user.inventory) {
          throw new HttpException(
            `User has no inventory`,
            HttpStatus.NOT_FOUND,
          );
        }
        let inventoryItems = user.inventory.inventoryItems;
        if (data.inventoryType === 'duplicateown') {
          inventoryItems = inventoryItems.filter((ii) => ii.amount > 1);
        }
        if (
          data.inventoryType === 'owned' ||
          data.inventoryType === 'duplicateown'
        ) {
          query.andWhere(this._whereString('id', 'IN', ['(:...ids)']), {
            ids: inventoryItems.map((ii) => ii.item.id),
          });
        }
        if (data.inventoryType === 'notowned') {
          const ids = user.inventory.inventoryItems.map((ii) => ii.item.id);
          query.andWhere(this._whereString('id', 'NOT IN', ['(:...ids)']), {
            ids,
          });
          query.andWhere(this._whereString('tagSlot', '!=', ["'recipe'"]));
          query.andWhere(this._whereString('tagSlot', '!=', ["'ingredient'"]));
        }
      }
      if (data.onlyWishlistItems && user.market.wishes.length > 0) {
        query.andWhere(this._whereString('id', 'IN', ['(:...wishIds)']), {
          wishIds: user.market.wishes.map((wish) => wish.item.id),
        });
      } else if (data.onlyWishlistItems) {
        return [];
      }
    }

    return query.getMany();
  }

  private _whereString(
    itemKey: string,
    comparer: string,
    properties: string[],
  ) {
    const parts = properties.map((property) => {
      return `item.${itemKey} ${comparer} ${property}`;
    });
    return `(${parts.join(' OR ')})`;
  }
}
