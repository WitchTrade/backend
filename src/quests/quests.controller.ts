import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { UserDecorator } from 'src/users/decorators/user.decorator';
import { QuestsService } from './quests.service';

@Controller('quests')
export class QuestsController {
  constructor(private _questsService: QuestsService) {}

  @UseGuards(AuthGuard)
  @Get()
  getQuests(@UserDecorator('id') uuid: string) {
    return this._questsService.getQuests(uuid);
  }
}
