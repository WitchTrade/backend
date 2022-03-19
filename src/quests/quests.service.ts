import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { catchError, firstValueFrom } from 'rxjs';
import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Quest } from './entities/quest.entity';
import { UserQuest } from './entities/userQuest.entity';
import { QuestResponse, QuestType } from './models/questResponse.model';

@Injectable()
export class QuestsService {
  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    @InjectRepository(UserQuest)
    private _userQuestRepository: Repository<UserQuest>,
    @InjectRepository(Quest)
    private _questRepository: Repository<Quest>,
    @InjectRepository(Item)
    private _itemRepository: Repository<Item>,
    private _httpService: HttpService
  ) { }

  public async getQuests(uuid: string) {
    const user = await this._userRepository.findOne(uuid);
    if (!user) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST
      );
    }
    if (!user.verifiedSteamProfileLink) {
      throw new HttpException(
        'Steam profile link not verified.',
        HttpStatus.UNAUTHORIZED
      );
    }

    if (user.questsCachedAt && this._cacheIsValid(user.questsCachedAt)) {
      const cachedQuests = await this._userQuestRepository.find({ where: { user: { id: uuid } }, relations: ['quest', 'rewardItem'] });
      return { quests: cachedQuests, cachedAt: user.questsCachedAt };
    }

    const steamUrlIdRegex = user.steamProfileLink.match(/^https:\/\/steamcommunity\.com\/profiles\/([^/]+).*$/);
    const steamProfileId = steamUrlIdRegex[1];

    // TODO: Replace 1234 with steamProfileId
    const questResponse = (await this._getQuests('1234')).data;
    if (!questResponse.success) {
      console.error(`Failed to get quests from steam account ${steamProfileId}`);
      console.error(questResponse.errorCode);
      throw new HttpException(
        `Failed to get quests`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this._saveQuests(questResponse.quests, user);

    const quests = await this._userQuestRepository.find({ where: { user: { id: uuid } }, relations: ['quest', 'rewardItem'] })
    return { quests, cachedAt: user.questsCachedAt };
  }

  private _cacheIsValid(cachedAt: Date) {
    return (new Date().getTime() - cachedAt.getTime()) < parseInt(process.env.QUEST_CACHETIME, 10);
  }

  private _getQuests(steamId: string) {
    return firstValueFrom(this._httpService.get<QuestResponse>(
      `${process.env.QUEST_ENDPOINT}community/getActiveQuests?authToken=${process.env.QUEST_AUTH_TOKEN}&accountName=${steamId}`
    ).pipe(
      catchError(e => {
        console.error(`Failed to get quests from steam account ${steamId}`);
        console.error(e);
        throw new HttpException(
          `Failed to get quests`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }),
    ));
  }

  private async _saveQuests(responseQuests: QuestType[], user: User) {
    await this._userQuestRepository.delete({ user: { id: user.id } });
    const quests = [];
    for (const resQuest of responseQuests) {
      const quest = new UserQuest;
      quest.user = user;
      quest.quest = await this._questRepository.findOne(resQuest.questId);
      if (!quest.quest) {
        console.error(`Quest not found for id: ${resQuest.questId}`);
        continue;
      }
      quest.completed = resQuest.isCompleted;
      quest.type = resQuest.type.toLowerCase() as 'daily' | 'weekly';
      quest.rewardItem = await this._itemRepository.findOne(parseInt(resQuest.rewardVal.split('x')[0]));
      if (!quest.rewardItem) {
        console.error(`Item for quest not found. questId: ${resQuest.questId}, rewardVal: ${resQuest.rewardVal}`);
        continue;
      }
      quest.rewardAmount = parseInt(resQuest.rewardVal.split('x')[1]);
      quest.progress = parseInt(resQuest.objective1Val);
      quest.maxProgress = parseInt(resQuest.objective1Max);
      quests.push(quest);
    }

    await this._userQuestRepository.save(quests);
    user.questsCachedAt = new Date();
    await this._userRepository.save(user);
  }
}
