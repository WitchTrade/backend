import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { SyncSettings } from '../users/entities/syncSettings.entity';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { SteamService } from './steam.service';
import { OffersService } from '../markets/offers.service';

@Injectable()
export class SteamAutoSyncService {
  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    @InjectRepository(SyncSettings)
    private _syncSettingsRepository: Repository<SyncSettings>,
    private _steamService: SteamService,
    private _offersService: OffersService,
  ) {}

  @Cron('0 * * * *')
  async automaticInvSync() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const inventoriesToSync = await this._userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.lastOnline'])
      .leftJoin('user.inventory', 'inv')
      .addSelect(['inv.id'])
      .leftJoin('user.syncSettings', 'syncSettings')
      .addSelect('syncSettings')
      .leftJoin('syncSettings.mainPriceItem', 'mainPriceItem')
      .addSelect('mainPriceItem')
      .leftJoin('syncSettings.secondaryPriceItem', 'secondaryPriceItem')
      .addSelect('secondaryPriceItem')
      .leftJoin('syncSettings.mainPriceRecipe', 'mainPriceRecipe')
      .addSelect('mainPriceRecipe')
      .leftJoin('syncSettings.secondaryPriceRecipe', 'secondaryPriceRecipe')
      .addSelect('secondaryPriceRecipe')
      .leftJoin('syncSettings.ignoreList', 'ignoreList')
      .addSelect('ignoreList')
      .where('syncSettings.syncInventory AND user.lastOnline > :oneWeekAgo', {
        oneWeekAgo,
      })
      .getMany();

    for (const invToSync of inventoriesToSync) {
      const minDelay = this._delay(parseInt(process.env.AUTOSYNCDELAY, 10));
      await this._steamService.syncInventory(
        invToSync.id,
        true,
        async (userBasedFail: boolean) => {
          if (userBasedFail) {
            invToSync.syncSettings.syncInventory = false;
            await this._syncSettingsRepository.save(invToSync.syncSettings);
          }
        },
      );
      if (invToSync.syncSettings.syncMarket) {
        await this._offersService.syncOffers(
          invToSync.syncSettings,
          invToSync.id,
        );
      }
      await minDelay;
    }
  }

  private _delay(time: number) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  }
}
