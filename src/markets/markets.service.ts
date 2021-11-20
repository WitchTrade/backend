import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { MoreThan, Repository } from 'typeorm';
import { MarketUpdateDTO } from './dtos/update.dto';
import { Market } from './entities/market.entity';
import { Offer } from './entities/offer.entity';
import { Wish } from './entities/wish.entity';
import { Price } from './entities/price.entity';

@Injectable()
export class MarketsService {

  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    @InjectRepository(Market)
    private _marketRepository: Repository<Market>,
    @InjectRepository(Offer)
    private _offerRepository: Repository<Offer>,
    @InjectRepository(Wish)
    private _wishRepository: Repository<Wish>,
    @InjectRepository(Price)
    private _priceRepository: Repository<Price>,
  ) { }

  public async getMarkets() {
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const users = await this._userRepository
      .createQueryBuilder('user')
      .select(['user.username', 'user.displayName', 'user.verified'])
      .leftJoinAndSelect('user.market', 'market')
      .where('user.hidden = 0 AND market.lastUpdated > :oneMonthAgo', { oneMonthAgo })
      .getMany();

    const markets: any[] = [];
    for (const user of users) {
      const offerCount = await this._offerRepository.count({ where: { market: user.market, quantity: MoreThan(0) } });

      if (offerCount !== 0) {
        const offers: { count: number, rarity: string; }[] = await this._offerRepository.createQueryBuilder('offer')
          .select('count(*)', 'count')
          .leftJoin('offer.item', 'item')
          .addSelect('item.tagRarity', 'rarity')
          .leftJoin('offer.market', 'market')
          .where('market.id = :marketId AND offer.quantity > 0', { marketId: user.market.id })
          .groupBy('item.tagRarity')
          .getRawMany();

        markets.push({ ...user, offerCount, offers });
      }
    }

    markets.sort((a, b) => a.offerCount - b.offerCount);

    return markets;
  }

  public async editMarket(data: MarketUpdateDTO, uuid: string) {
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

    user.market.offerlistNote = data.offerlistNote;
    user.market.wishlistNote = data.wishlistNote;

    await this._marketRepository.save(user.market);

    return this._getUserMarket(user.market.id, false);
  }

  public async getOwnMarket(uuid: string) {
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

    return this._getUserMarket(user.market.id, false);
  }

  public async getPublicMarket(username: string) {
    const user = await this._userRepository.findOne({ username }, { relations: ['market'] });
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

    return this._getUserMarket(user.market.id, true);
  }

  private async _getUserMarket(marketId: number, onlyPublicOffers: boolean) {
    const market = await this._marketRepository.createQueryBuilder('market')
      .select(['market.id', 'market.offerlistNote', 'market.wishlistNote', 'market.lastUpdated'])
      .where('market.id = :marketId', { marketId })
      .getOne();

    const offersQuery = this._offerRepository.createQueryBuilder('offer')
      .leftJoin('offer.market', 'market')
      .leftJoinAndSelect('offer.mainPrice', 'mainPrice')
      .leftJoinAndSelect('offer.secondaryPrice', 'secondaryPrice')
      .leftJoin('offer.item', 'item')
      .addSelect('item.id')
      .where('market.id = :marketId', { marketId: market.id });

    if (onlyPublicOffers) {
      offersQuery.andWhere('offer.quantity > 0');
    }

    const offers = await offersQuery.getMany();

    const wishes = await this._wishRepository.createQueryBuilder('wish')
      .leftJoin('wish.market', 'market')
      .leftJoinAndSelect('wish.mainPrice', 'mainPrice')
      .leftJoinAndSelect('wish.secondaryPrice', 'secondaryPrice')
      .leftJoin('wish.item', 'item')
      .addSelect('item.id')
      .where('market.id = :marketId', { marketId: market.id })
      .getMany();

    return { ...market, offers, wishes };
  }

  public getPrices() {
    return this._priceRepository.find();
  }

}
