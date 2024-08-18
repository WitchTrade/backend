import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { catchError, firstValueFrom } from 'rxjs';

type UserLookup =
  | {
      success: true;
      message: '';
      witchItId: string;
      errorCode: 'noError';
    }
  | {
      success: false;
      message: string;
      witchItId: '';
      errorCode: string;
    };

type InventoryResponse = {
  success: boolean;
  entries: WitchItInventoryItem[];
};

export type WitchItInventoryItem = {
  id: number;
  stack?: number;
};

export type PreparedWitchItInventoryItem = {
  id: number;
  amount: number;
};

export interface QuestResponse {
  success: boolean;
  quests: QuestType[];
  errorCode: string;
}

export interface QuestType {
  name: string;
  isCompleted: boolean;
  type: string;
  questId: number;
  rewardVal: string;
  objective1Id: number;
  objective1Val: string;
  objective1Max: string;
}

const ITEM_IGNORE_LIST = [
  2251, // Fireworks
  2252, // Gunpowder
];

// Map DLC items that have duplicate definitions
const ITEM_MAP_LIST = {
  2315: 1977, // Head of the Eternal Protector
  2316: 1978, // Harness of the Eternal Protector
  2317: 1979, // Loincloth of the Eternal Protector
  2318: 1980, // Blade of the Eternal Protector
  2319: 1981, // Fragment of the Eternal Protector
  2320: 1984, // Helmet of the Winter Storm Witch
  2321: 1985, // Hair of the Winter Storm Witch
  2322: 1986, // Battledress of the Winter Storm Witch
  2323: 1987, // Axe of the Winter Storm Witch
  2324: 1988, // Frozen Gem of the Winter Storm
};

@Injectable()
export class WitchItService {
  constructor(private _httpService: HttpService) {}

  public async getWitchItUserId(
    platform: 'steam' | 'epic',
    platformIdentifier: string,
  ) {
    if (process.env.NODE_ENV !== 'production') {
      platformIdentifier = '1234';
    }

    return firstValueFrom(
      this._httpService
        .get<UserLookup>(
          `${process.env.WITCH_IT_ENDPOINT}/performUserLookup?authToken=${process.env.WITCH_IT_AUTH_TOKEN}&platform=${platform}&platformName=${platformIdentifier}`,
        )
        .pipe(
          catchError((e) => {
            console.error(
              `Failed to get user information of user: Platform: ${platform} Identifier: ${platformIdentifier}`,
            );
            console.error(e);
            throw new HttpException(
              `Failed to get Witch It user id. Do you own the game?`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }),
        ),
    );
  }

  public async getWitchItInventory(witchItUserId: string) {
    return firstValueFrom(
      this._httpService
        .get<InventoryResponse>(
          `${process.env.WITCH_IT_ENDPOINT}/getUserInventory?authToken=${process.env.WITCH_IT_AUTH_TOKEN}&productUserId=${witchItUserId}`,
        )
        .pipe(
          catchError((e) => {
            console.error(`Failed to get inventory of user: ${witchItUserId}`);
            console.error(e);
            throw new HttpException(
              `Failed to get witch it inventory`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }),
        ),
    );
  }

  public prepareInventoryItems(
    inventoryItems: WitchItInventoryItem[],
  ): PreparedWitchItInventoryItem[] {
    const preparedItems = inventoryItems
      .filter((item) => !ITEM_IGNORE_LIST.includes(item.id))
      .map((item) => {
        if (ITEM_MAP_LIST[item.id]) {
          item.id = ITEM_MAP_LIST[item.id];
        }
        return item;
      })
      .reduce((preparedItems, item) => {
        const existing = preparedItems.find(
          (preparedItem) => preparedItem.id === item.id,
        );
        if (existing) {
          existing.amount += item.stack ?? 1;
        } else {
          preparedItems.push({
            id: item.id,
            amount: item.stack ?? 1,
          });
        }
        return preparedItems;
      }, [] as PreparedWitchItInventoryItem[]);
    return preparedItems;
  }

  public async getQuests(witchItUserId: string) {
    return firstValueFrom(
      this._httpService
        .get<QuestResponse>(
          `${process.env.WITCH_IT_ENDPOINT}/getActiveQuests?authToken=${process.env.WITCH_IT_AUTH_TOKEN}&productUserId=${witchItUserId}`,
        )
        .pipe(
          catchError((e) => {
            console.error(
              `Failed to get quests of witch it user: ${witchItUserId}`,
            );
            console.error(e);
            throw new HttpException(
              `Failed to get witch it inventory`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }),
        ),
    );
  }
}
