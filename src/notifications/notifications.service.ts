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

  public async sendNotification(wantUserId: string, haveUser: User, item: Item) {
    const notification = new Notification();
    notification.text = `in ${haveUser.displayName}'s market`;
    notification.link = `https://witchtrade.org/profile/${haveUser.username}/offers/?highlight=${item.id}`;
    notification.iconLink = item.iconUrl;
    notification.user = await this._userRepository.findOne(wantUserId);

    const alreadyExisting = await this._notificationRepository.findOne(notification);
    if (alreadyExisting) {
      return;
    }

    await this._notificationRepository.save(notification);
  }
}
