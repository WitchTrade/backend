import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';
import { QuestType, WitchItService } from 'src/witchit/witchIt.service';
import { Repository } from 'typeorm';
import { Quest } from './entities/quest.entity';
import { UserQuest } from './entities/userQuest.entity';

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
    private _witchItService: WitchItService,
  ) {}

  public async getQuests(uuid: string) {
    const user = await this._userRepository.findOne(uuid);
    if (!user) {
      throw new HttpException('User not found.', HttpStatus.BAD_REQUEST);
    }
    if (!user.verifiedSteamProfileLink || !user.witchItUserId) {
      throw new HttpException(
        'Steam profile not verified. Please go to your profile settings and verify it.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.questsCachedAt && this._cacheIsValid(user.questsCachedAt)) {
      const cachedQuests = await this._userQuestRepository.find({
        where: { user: { id: uuid } },
        relations: ['quest', 'rewardItem'],
      });
      return { quests: cachedQuests, cachedAt: user.questsCachedAt };
    }

    const questResponse = (
      await this._witchItService.getQuests(user.witchItUserId)
    ).data;
    if (!questResponse.success) {
      console.error(
        `Failed to get quests for witch it user ${user.witchItUserId}`,
      );
      console.error(questResponse.errorCode);
      throw new HttpException(
        `Failed to get quests`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this._saveQuests(questResponse.quests, user);

    const quests = await this._userQuestRepository.find({
      where: { user: { id: uuid } },
      relations: ['quest', 'rewardItem'],
    });
    return { quests, cachedAt: user.questsCachedAt };
  }

  private _cacheIsValid(cachedAt: Date) {
    return (
      new Date().getTime() - cachedAt.getTime() <
      parseInt(process.env.QUEST_CACHETIME, 10)
    );
  }

  private async _saveQuests(responseQuests: QuestType[], user: User) {
    await this._userQuestRepository.delete({ user: { id: user.id } });
    const quests = [];
    for (const resQuest of responseQuests) {
      const quest = new UserQuest();
      quest.user = user;
      quest.quest = await this._questRepository.findOne(resQuest.questId);
      if (!quest.quest) {
        console.error(`Quest not found for id: ${resQuest.questId}`);
        continue;
      }
      quest.completed = resQuest.isCompleted;
      quest.type = resQuest.type.toLowerCase() as 'daily' | 'weekly';
      quest.rewardItem = await this._itemRepository.findOne(
        parseInt(resQuest.rewardVal.split('x')[0]),
      );
      if (!quest.rewardItem) {
        console.error(
          `Item for quest not found. questId: ${resQuest.questId}, rewardVal: ${resQuest.rewardVal}`,
        );
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
