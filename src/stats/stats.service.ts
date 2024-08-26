import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Offer } from 'src/markets/entities/offer.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import appInformation from '../../package.json';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    @InjectRepository(Offer)
    private _offerRepository: Repository<Offer>,
  ) {}

  public getVersion() {
    return appInformation.version;
  }

  public async getWitchTradeStats() {
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const offerCountRequest = await this._offerRepository
      .createQueryBuilder('offer')
      .select('count(*)', 'count')
      .leftJoin('offer.market', 'market')
      .leftJoin('market.user', 'user')
      .where(
        'offer.quantity > 0 AND user.hidden = FALSE AND user.banned = FALSE AND market.lastUpdated > :oneMonthAgo',
        { oneMonthAgo },
      )
      .getRawOne();

    const userCount = await this._userRepository.count({ banned: false });

    return { users: userCount, offers: parseInt(offerCountRequest.count, 10) };
  }
}
