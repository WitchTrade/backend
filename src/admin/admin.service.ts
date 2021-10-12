import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createAdminUser, User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { AdminBanDTO } from './dtos/ban.dto';
import { AdminUnbanDTO } from './dtos/unban.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
  ) { }

  public async getUsers(uuid: string) {
    const requestingUser = await this._userRepository.findOne(uuid, { relations: ['roles'] });
    if (requestingUser.roles.length === 0) {
      throw new HttpException(
        'Permission denied.',
        HttpStatus.FORBIDDEN
      );
    }

    const users = await this._userRepository.find({
      select: [
        'id',
        'username',
        'displayName',
        'verified',
        'banned',
        'banMessage'
      ],
      relations: [
        'roles'
      ]
    });

    return users;
  }

  public async banUser(uuid: string, banData: AdminBanDTO) {
    const requestingUser = await this._userRepository.findOne(uuid, { relations: ['roles'] });
    if (requestingUser.roles.length === 0) {
      throw new HttpException(
        'Permission denied.',
        HttpStatus.FORBIDDEN
      );
    }

    const userToBan = await this._userRepository.findOne(banData.userId, { relations: ['roles'] });
    if (userToBan.roles.length !== 0) {
      throw new HttpException(
        'User cannot be banned.',
        HttpStatus.FORBIDDEN
      );
    }

    if (userToBan.banned) {
      throw new HttpException(
        'User is already banned.',
        HttpStatus.FORBIDDEN
      );
    }

    userToBan.banned = true;
    userToBan.banMessage = banData.reason;

    await this._userRepository.save(userToBan);

    return createAdminUser(userToBan);
  }

  public async unbanUser(uuid: string, unbanData: AdminUnbanDTO) {
    const requestingUser = await this._userRepository.findOne(uuid, { relations: ['roles'] });
    if (requestingUser.roles.length === 0) {
      throw new HttpException(
        'Permission denied.',
        HttpStatus.FORBIDDEN
      );
    }

    const userToBan = await this._userRepository.findOne(unbanData.userId, { relations: ['roles'] });
    if (userToBan.roles.length !== 0) {
      throw new HttpException(
        'User cannot be unbanned.',
        HttpStatus.FORBIDDEN
      );
    }

    if (!userToBan.banned) {
      throw new HttpException(
        'User is not banned.',
        HttpStatus.FORBIDDEN
      );
    }

    userToBan.banned = false;
    userToBan.banMessage = null;

    await this._userRepository.save(userToBan);

    return createAdminUser(userToBan);
  }

}
