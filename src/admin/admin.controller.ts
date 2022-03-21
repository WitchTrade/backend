import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { Notification } from '../notifications/entities/notification.entity';
import { AuthGuard } from '../guards/auth.guard';
import { UserDecorator } from '../users/decorators/user.decorator';
import { Badge } from '../users/entities/badge.entity';
import { AdminUser } from '../users/entities/user.entity';
import { AdminService } from './admin.service';
import { AdminBadgeDTO } from './dtos/badge.dto';
import { AdminBanDTO } from './dtos/ban.dto';
import { AdminRoleDTO } from './dtos/role.dto';
import { AdminUnbanDTO } from './dtos/unban.dto';
import { AdminVerifyDTO } from './dtos/verify.dto';
import { AdminLog } from './entities/adminlog.entity';
import { AdminNotificationDTO } from './dtos/notification.dto';

@Controller('admin')
export class AdminController {
  constructor(private _adminService: AdminService) {}

  @UseGuards(AuthGuard)
  @Get('users')
  public getUsers(@UserDecorator('id') uuid: string): Promise<AdminUser[]> {
    return this._adminService.getUsers(uuid);
  }

  @UseGuards(AuthGuard)
  @Post('ban')
  public banUser(
    @UserDecorator('id') uuid: string,
    @Body() banData: AdminBanDTO,
  ): Promise<AdminUser> {
    return this._adminService.banUser(uuid, banData);
  }

  @UseGuards(AuthGuard)
  @Delete('ban')
  public unbanUser(
    @UserDecorator('id') uuid: string,
    @Body() unbanData: AdminUnbanDTO,
  ): Promise<AdminUser> {
    return this._adminService.unbanUser(uuid, unbanData);
  }

  @UseGuards(AuthGuard)
  @Get('badges')
  public getBadges(@UserDecorator('id') uuid: string): Promise<Badge[]> {
    return this._adminService.getBadges(uuid);
  }

  @UseGuards(AuthGuard)
  @Post('badge')
  public addBadge(
    @UserDecorator('id') uuid: string,
    @Body() badgeData: AdminBadgeDTO,
  ): Promise<AdminUser> {
    return this._adminService.addBadge(uuid, badgeData);
  }

  @UseGuards(AuthGuard)
  @Delete('badge')
  public removeBadge(
    @UserDecorator('id') uuid: string,
    @Body() badgeData: AdminBadgeDTO,
  ): Promise<AdminUser> {
    return this._adminService.removeBadge(uuid, badgeData);
  }

  @UseGuards(AuthGuard)
  @Get('roles')
  public getRoles(@UserDecorator('id') uuid: string): Promise<Badge[]> {
    return this._adminService.getRoles(uuid);
  }

  @UseGuards(AuthGuard)
  @Post('role')
  public addRole(
    @UserDecorator('id') uuid: string,
    @Body() roleData: AdminRoleDTO,
  ): Promise<AdminUser> {
    return this._adminService.addRole(uuid, roleData);
  }

  @UseGuards(AuthGuard)
  @Delete('role')
  public removeRole(
    @UserDecorator('id') uuid: string,
    @Body() roleData: AdminRoleDTO,
  ): Promise<AdminUser> {
    return this._adminService.removeRole(uuid, roleData);
  }

  @UseGuards(AuthGuard)
  @Post('verify')
  public verifyUser(
    @UserDecorator('id') uuid: string,
    @Body() verifyData: AdminVerifyDTO,
  ): Promise<AdminUser> {
    return this._adminService.verifyUser(uuid, verifyData);
  }

  @UseGuards(AuthGuard)
  @Delete('verify')
  public unverifyUser(
    @UserDecorator('id') uuid: string,
    @Body() verifyData: AdminVerifyDTO,
  ): Promise<AdminUser> {
    return this._adminService.unverifyUser(uuid, verifyData);
  }

  @UseGuards(AuthGuard)
  @Get('log')
  public getAdminLog(@UserDecorator('id') uuid: string): Promise<AdminLog[]> {
    return this._adminService.getAdminLog(uuid);
  }

  @UseGuards(AuthGuard)
  @Post('notification')
  public sendNotification(
    @UserDecorator('id') uuid: string,
    @Body() notificationInfo: AdminNotificationDTO,
  ): Promise<void> {
    return this._adminService.sendNotification(uuid, notificationInfo);
  }

  @UseGuards(AuthGuard)
  @Post('broadcast')
  public broadcastNotification(
    @UserDecorator('id') uuid: string,
    @Body() notification: Partial<Notification>,
  ): Promise<void> {
    return this._adminService.broadcastNotification(uuid, notification);
  }
}
