import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private _notificationRepository: Repository<Notification>) {
  }

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
}
