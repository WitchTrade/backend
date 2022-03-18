import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';
import { Quest } from './entities/quest.entity';
import { UserQuest } from './entities/userQuest.entity';
import { QuestsController } from './quests.controller';
import { QuestsService } from './quests.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserQuest, Quest, Item]),
    HttpModule,
  ],
  controllers: [QuestsController],
  providers: [QuestsService]
})
export class QuestsModule { }
