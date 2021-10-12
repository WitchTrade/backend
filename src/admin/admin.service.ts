import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from '../users/entities/badge.entity';
import { createAdminUser, User } from '../users/entities/user.entity';
import { AdminBadgeDTO } from './dtos/badge.dto';
import { AdminBanDTO } from './dtos/ban.dto';
import { AdminUnbanDTO } from './dtos/unban.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    @InjectRepository(Badge)
    private _badgeRepository: Repository<Badge>,
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
        'roles',
        'badges'
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

    const userToBan = await this._userRepository.findOne(banData.userId, { relations: ['roles', 'badges'] });
    if (!userToBan) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST
      );
    }

    if (userToBan.roles.length !== 0) {
      throw new HttpException(
        'User cannot be banned.',
        HttpStatus.FORBIDDEN
      );
    }

    if (userToBan.banned) {
      throw new HttpException(
        'User is already banned.',
        HttpStatus.BAD_REQUEST
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

    const userToBan = await this._userRepository.findOne(unbanData.userId, { relations: ['roles', 'badges'] });
    if (!userToBan) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST
      );
    }

    if (userToBan.roles.length !== 0) {
      throw new HttpException(
        'User cannot be unbanned.',
        HttpStatus.FORBIDDEN
      );
    }

    if (!userToBan.banned) {
      throw new HttpException(
        'User is not banned.',
        HttpStatus.BAD_REQUEST
      );
    }

    userToBan.banned = false;
    userToBan.banMessage = null;

    await this._userRepository.save(userToBan);

    return createAdminUser(userToBan);
  }

  public async getBadges(uuid: string) {
    const requestingUser = await this._userRepository.findOne(uuid, { relations: ['roles'] });
    if (requestingUser.roles.length === 0) {
      throw new HttpException(
        'Permission denied.',
        HttpStatus.FORBIDDEN
      );
    }

    const badges = await this._badgeRepository.find();

    return badges;
  }

  public async addBadge(uuid: string, badgeData: AdminBadgeDTO) {
    const requestingUser = await this._userRepository.findOne(uuid, { relations: ['roles'] });
    if (
      requestingUser.roles.length === 0 ||
      !requestingUser.roles.some(role => role.rank === 1)
    ) {
      throw new HttpException(
        'Permission denied.',
        HttpStatus.FORBIDDEN
      );
    }

    const userToModify = await this._userRepository.findOne(badgeData.userId, { relations: ['roles', 'badges'] });
    if (!userToModify) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST
      );
    }

    if (userToModify.badges.some(badge => badge.id === badgeData.badgeId)) {
      throw new HttpException(
        'User already has this badge.',
        HttpStatus.BAD_REQUEST
      );
    }

    const badgeToAdd = await this._badgeRepository.findOne(badgeData.badgeId);
    if (!badgeToAdd) {
      throw new HttpException(
        'Badge not found.',
        HttpStatus.BAD_REQUEST
      );
    }

    userToModify.badges.push(badgeToAdd);

    await this._userRepository.save(userToModify);

    return createAdminUser(userToModify);
  }

  public async removeBadge(uuid: string, badgeData: AdminBadgeDTO) {
    const requestingUser = await this._userRepository.findOne(uuid, { relations: ['roles'] });
    if (
      requestingUser.roles.length === 0 ||
      !requestingUser.roles.some(role => role.rank === 1)
    ) {
      throw new HttpException(
        'Permission denied.',
        HttpStatus.FORBIDDEN
      );
    }

    const userToModify = await this._userRepository.findOne(badgeData.userId, { relations: ['roles', 'badges'] });
    if (!userToModify) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST
      );
    }

    if (!userToModify.badges.some(badge => badge.id === badgeData.badgeId)) {
      throw new HttpException(
        'User doesn\'t own this badge',
        HttpStatus.BAD_REQUEST
      );
    }

    const badgeToRemove = await this._badgeRepository.findOne(badgeData.badgeId);
    if (!badgeToRemove) {
      throw new HttpException(
        'Badge not found.',
        HttpStatus.BAD_REQUEST
      );
    }

    userToModify.badges = userToModify.badges.filter(badge => badge.id !== badgeToRemove.id);

    await this._userRepository.save(userToModify);

    return createAdminUser(userToModify);
  }

}
