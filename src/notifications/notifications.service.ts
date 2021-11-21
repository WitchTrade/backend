import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../items/entities/item.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private _notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private _userRepository: Repository<User>,
  ) { }

  public async getNotificationsOfUser(uuid: string) {
    return this._notificationRepository.find({ where: { user: { id: uuid } } });
  }

  public async deleteNotification(id: number, uuid: string) {
    const notification = await this._notificationRepository.findOne(id, { relations: ['user'] });
    if (!notification) {
      throw new HttpException(
        'Notification not found.',
        HttpStatus.NOT_FOUND,
      );
    }
    if (notification.user.id !== uuid) {
      throw new HttpException(
        'You do not own this notification.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this._notificationRepository.remove(notification);

    return;
  }

  public async deleteAllNotifications(uuid: string) {
    const notifications = await this._notificationRepository.find({ where: { user: { id: uuid } }, relations: ['user'] });

    await this._notificationRepository.remove(notifications);

    return;
  }

  public async sendNotification(wantUserId: string, haveUser: User, item: Item) {
    const notification = new Notification();
    notification.text = `in ${haveUser.displayName}'s market`;
    notification.link = `https://witchtrade.org/@/${haveUser.username}?searchString=${item.name.split(' ').join('+')}&itemSlot=${item.tagSlot}`;
    notification.iconLink = item.iconUrl;
    notification.user = await this._userRepository.findOne(wantUserId);
    notification.targetUser = haveUser;
    notification.targetItem = item;

    const alreadyExisting = await this._notificationRepository.findOne(notification);
    if (alreadyExisting) {
      return;
    }

    await this._notificationRepository.save(notification);
  }
}
