import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PERMISSION, Role } from '../users/entities/role.entity';
import { Repository } from 'typeorm';
import { Badge } from '../users/entities/badge.entity';
import { createAdminUser, User } from '../users/entities/user.entity';
import { AdminBadgeDTO } from './dtos/badge.dto';
import { AdminBanDTO } from './dtos/ban.dto';
import { AdminRoleDTO } from './dtos/role.dto';
import { AdminUnbanDTO } from './dtos/unban.dto';
import { AdminVerifyDTO } from './dtos/verify.dto';
import { ACTIONGROUP, ACTIONTYPE, AdminLog } from './entities/adminlog.entity';
import { Notification } from '../notifications/entities/notification.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    @InjectRepository(Badge)
    private _badgeRepository: Repository<Badge>,
    @InjectRepository(Role)
    private _roleRepository: Repository<Role>,
    @InjectRepository(AdminLog)
    private _adminLogRepository: Repository<AdminLog>,
    @InjectRepository(Notification)
    private _notificationRepository: Repository<Notification>,
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
    if (!this._hasPermission(requestingUser.roles, PERMISSION.BAN)) {
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

    if (
      this._hasPermission(requestingUser.roles, PERMISSION.ADMIN)
    ) {
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

    await this._adminLogRepository.insert({
      user: requestingUser,
      actionGroup: ACTIONGROUP.BAN,
      actionType: ACTIONTYPE.POST,
      targetUser: userToBan,
      log: `Banned with reason ${banData.reason}`
    });

    return createAdminUser(userToBan);
  }

  public async unbanUser(uuid: string, unbanData: AdminUnbanDTO) {
    const requestingUser = await this._userRepository.findOne(uuid, { relations: ['roles'] });
    if (!this._hasPermission(requestingUser.roles, PERMISSION.BAN)) {
      throw new HttpException(
        'Permission denied.',
        HttpStatus.FORBIDDEN
      );
    }

    const userToUnban = await this._userRepository.findOne(unbanData.userId, { relations: ['roles', 'badges'] });
    if (!userToUnban) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      this._hasPermission(requestingUser.roles, PERMISSION.ADMIN)
    ) {
      throw new HttpException(
        'User cannot be unbanned.',
        HttpStatus.FORBIDDEN
      );
    }

    if (!userToUnban.banned) {
      throw new HttpException(
        'User is not banned.',
        HttpStatus.BAD_REQUEST
      );
    }

    userToUnban.banned = false;
    userToUnban.banMessage = null;

    await this._userRepository.save(userToUnban);

    await this._adminLogRepository.insert({
      user: requestingUser,
      actionGroup: ACTIONGROUP.BAN,
      actionType: ACTIONTYPE.DELETE,
      targetUser: userToUnban,
      log: `Unbanned`
    });

    return createAdminUser(userToUnban);
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

    if (!this._hasPermission(requestingUser.roles, PERMISSION.BADGES)) {
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

    await this._adminLogRepository.insert({
      user: requestingUser,
      actionGroup: ACTIONGROUP.BADGES,
      actionType: ACTIONTYPE.POST,
      targetUser: userToModify,
      log: `Added badge ${badgeToAdd.id}.`
    });

    return createAdminUser(userToModify);
  }

  public async removeBadge(uuid: string, badgeData: AdminBadgeDTO) {
    const requestingUser = await this._userRepository.findOne(uuid, { relations: ['roles'] });
    if (!this._hasPermission(requestingUser.roles, PERMISSION.BADGES)) {
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
        'User doesn\'t own this badge.',
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

    await this._adminLogRepository.insert({
      user: requestingUser,
      actionGroup: ACTIONGROUP.BADGES,
      actionType: ACTIONTYPE.DELETE,
      targetUser: userToModify,
      log: `Removed badge ${badgeToRemove.id}.`
    });

    return createAdminUser(userToModify);
  }

  public async getRoles(uuid: string) {
    const requestingUser = await this._userRepository.findOne(uuid, { relations: ['roles'] });
    if (requestingUser.roles.length === 0) {
      throw new HttpException(
        'Permission denied.',
        HttpStatus.FORBIDDEN
      );
    }

    const roles = await this._roleRepository.find();

    return roles;
  }

  public async addRole(uuid: string, roleData: AdminRoleDTO) {
    const requestingUser = await this._userRepository.findOne(uuid, { relations: ['roles'] });
    if (!this._hasPermission(requestingUser.roles, PERMISSION.ROLES)) {
      throw new HttpException(
        'Permission denied.',
        HttpStatus.FORBIDDEN
      );
    }

    const userToModify = await this._userRepository.findOne(roleData.userId, { relations: ['roles', 'badges'] });
    if (!userToModify) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST
      );
    }

    if (userToModify.roles.some(role => role.id === roleData.roleId)) {
      throw new HttpException(
        'User already has this role.',
        HttpStatus.BAD_REQUEST
      );
    }

    const roleToAdd = await this._roleRepository.findOne(roleData.roleId);
    if (!roleToAdd) {
      throw new HttpException(
        'Role not found.',
        HttpStatus.BAD_REQUEST
      );
    }

    const ownRank = this._getHighestRoleRank(requestingUser.roles);
    if (roleToAdd.rank <= ownRank) {
      throw new HttpException(
        'You aren\'t allowed to give or remove this role',
        HttpStatus.BAD_REQUEST
      );
    }

    userToModify.roles.push(roleToAdd);

    await this._userRepository.save(userToModify);

    await this._adminLogRepository.insert({
      user: requestingUser,
      actionGroup: ACTIONGROUP.ROLES,
      actionType: ACTIONTYPE.POST,
      targetUser: userToModify,
      log: `Added role ${roleToAdd.id}.`
    });

    return createAdminUser(userToModify);
  }

  public async removeRole(uuid: string, roleData: AdminRoleDTO) {
    const requestingUser = await this._userRepository.findOne(uuid, { relations: ['roles'] });
    if (!this._hasPermission(requestingUser.roles, PERMISSION.ROLES)) {
      throw new HttpException(
        'Permission denied.',
        HttpStatus.FORBIDDEN
      );
    }

    const userToModify = await this._userRepository.findOne(roleData.userId, { relations: ['roles', 'badges'] });
    if (!userToModify) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST
      );
    }

    if (!userToModify.roles.some(role => role.id === roleData.roleId)) {
      throw new HttpException(
        'User doesn\'t own this role.',
        HttpStatus.BAD_REQUEST
      );
    }

    const roleToRemove = await this._roleRepository.findOne(roleData.roleId);
    if (!roleToRemove) {
      throw new HttpException(
        'Role not found.',
        HttpStatus.BAD_REQUEST
      );
    }

    const ownRank = this._getHighestRoleRank(requestingUser.roles);
    if (roleToRemove.rank <= ownRank) {
      throw new HttpException(
        'You aren\'t allowed to give or remove this role',
        HttpStatus.BAD_REQUEST
      );
    }

    userToModify.roles = userToModify.roles.filter(role => role.id !== roleToRemove.id);

    await this._userRepository.save(userToModify);

    await this._adminLogRepository.insert({
      user: requestingUser,
      actionGroup: ACTIONGROUP.ROLES,
      actionType: ACTIONTYPE.DELETE,
      targetUser: userToModify,
      log: `Removed role ${roleToRemove.id}.`
    });

    return createAdminUser(userToModify);
  }

  private _getHighestRoleRank(roles: Role[]) {
    return Math.min(...roles.map(role => role.rank));
  }

  public async verifyUser(uuid: string, verifyData: AdminVerifyDTO) {
    const requestingUser = await this._userRepository.findOne(uuid, { relations: ['roles'] });
    if (!this._hasPermission(requestingUser.roles, PERMISSION.VERIFY)) {
      throw new HttpException(
        'Permission denied.',
        HttpStatus.FORBIDDEN
      );
    }

    const userToVerify = await this._userRepository.findOne(verifyData.userId, { relations: ['roles', 'badges'] });
    if (!userToVerify) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST
      );
    }

    if (userToVerify.verified) {
      throw new HttpException(
        'User is already verified.',
        HttpStatus.BAD_REQUEST
      );
    }

    userToVerify.verified = true;

    await this._userRepository.save(userToVerify);

    await this._adminLogRepository.insert({
      user: requestingUser,
      actionGroup: ACTIONGROUP.VERIFY,
      actionType: ACTIONTYPE.POST,
      targetUser: userToVerify,
      log: `Verified`
    });

    return createAdminUser(userToVerify);
  }

  public async unverifyUser(uuid: string, verifyData: AdminVerifyDTO) {
    const requestingUser = await this._userRepository.findOne(uuid, { relations: ['roles'] });
    if (!this._hasPermission(requestingUser.roles, PERMISSION.VERIFY)) {
      throw new HttpException(
        'Permission denied.',
        HttpStatus.FORBIDDEN
      );
    }

    const userToUnverify = await this._userRepository.findOne(verifyData.userId, { relations: ['roles', 'badges'] });
    if (!userToUnverify) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST
      );
    }

    if (!userToUnverify.verified) {
      throw new HttpException(
        'User is not verified.',
        HttpStatus.BAD_REQUEST
      );
    }

    userToUnverify.verified = false;

    await this._userRepository.save(userToUnverify);

    await this._adminLogRepository.insert({
      user: requestingUser,
      actionGroup: ACTIONGROUP.VERIFY,
      actionType: ACTIONTYPE.DELETE,
      targetUser: userToUnverify,
      log: `Unverified`
    });

    return createAdminUser(userToUnverify);
  }

  private _hasPermission(roles: Role[], permission: PERMISSION): boolean {
    const permissionLength = Object.keys(PERMISSION).length / 2;
    const filler = new Array(permissionLength + 1).join('0');
    const negativePermissionLength = -Math.abs(permissionLength);

    for (const role of roles) {
      const permissions = role.permissions;
      const binaryPermissionString = (filler + permissions.toString(2)).slice(negativePermissionLength);

      if (binaryPermissionString[permission] === '1') {
        return true;
      }
    }

    return false;
  }

  public async getAdminLog(uuid: string) {
    const requestingUser = await this._userRepository.findOne(uuid, { relations: ['roles'] });
    if (!this._hasPermission(requestingUser.roles, PERMISSION.VERIFY)) {
      throw new HttpException(
        'Permission denied.',
        HttpStatus.FORBIDDEN
      );
    }

    const log = await this._adminLogRepository.find({ relations: ['user', 'targetUser'] });

    const modifiedLog = log.map((log: any) => {
      log.username = log.user.username;
      log.targetUsername = log.targetUser.username;

      delete log.user;
      delete log.targetUser;

      return log;
    });

    return modifiedLog;
  }

  public async broadcastNotification(uuid: string, data: Partial<Notification>) {
    const requestingUser = await this._userRepository.findOne(uuid, { relations: ['roles'] });

    if (!this._hasPermission(requestingUser.roles, PERMISSION.ADMIN)) {
      throw new HttpException(
        'Permission denied.',
        HttpStatus.FORBIDDEN
      );
    }

    const users = await this._userRepository.find();

    for (const user of users) {
      const notification = new Notification();
      notification.text = data.text;
      notification.link = data.link;
      notification.iconLink = data.iconLink;
      notification.user = user;
      await this._notificationRepository.save(notification);
    }

    return;
  }

}
