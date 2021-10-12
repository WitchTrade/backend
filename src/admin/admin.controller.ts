import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { UserDecorator } from '../users/decorators/user.decorator';
import { Badge } from '../users/entities/badge.entity';
import { AdminUser } from '../users/entities/user.entity';
import { AdminService } from './admin.service';
import { AdminBadgeDTO } from './dtos/badge.dto';
import { AdminBanDTO } from './dtos/ban.dto';
import { AdminUnbanDTO } from './dtos/unban.dto';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) { }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('users')
  public getUsers(@UserDecorator('id') uuid: string): Promise<AdminUser[]> {
    return this.adminService.getUsers(uuid);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('ban')
  public banUser(@UserDecorator('id') uuid: string, @Body() banData: AdminBanDTO): Promise<AdminUser> {
    return this.adminService.banUser(uuid, banData);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete('ban')
  public unbanUser(@UserDecorator('id') uuid: string, @Body() unbanData: AdminUnbanDTO): Promise<AdminUser> {
    return this.adminService.unbanUser(uuid, unbanData);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('badges')
  public getBadges(@UserDecorator('id') uuid: string): Promise<Badge[]> {
    return this.adminService.getBadges(uuid);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('badge')
  public addBadge(@UserDecorator('id') uuid: string, @Body() badgeData: AdminBadgeDTO): Promise<AdminUser> {
    return this.adminService.addBadge(uuid, badgeData);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete('badge')
  public removeBadge(@UserDecorator('id') uuid: string, @Body() badgeData: AdminBadgeDTO): Promise<AdminUser> {
    return this.adminService.removeBadge(uuid, badgeData);
  }

  // add role
  // remove role

  // verify user
  // un-verify user
}
