import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { UserDecorator } from '../users/decorators/user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private _notificationsService: NotificationsService) { }

  @UseGuards(AuthGuard)
  @Get('')
  getNotificationsOfUser(@UserDecorator('id') uuid: string) {
    return this._notificationsService.getNotificationsOfUser(uuid);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  deleteNotification(@Param('id') id: number, @UserDecorator('id') uuid: string) {
    return this._notificationsService.deleteNotification(id, uuid);
  }

  @UseGuards(AuthGuard)
  @Delete('')
  deleteAllNotifications(@UserDecorator('id') uuid: string) {
    return this._notificationsService.deleteAllNotifications(uuid);
  }
}
