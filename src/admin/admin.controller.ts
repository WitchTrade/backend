import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('roles')
  public getRoles(@UserDecorator('id') uuid: string): Promise<Badge[]> {
    return this.adminService.getRoles(uuid);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('role')
  public addRole(@UserDecorator('id') uuid: string, @Body() roleData: AdminRoleDTO): Promise<AdminUser> {
    return this.adminService.addRole(uuid, roleData);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete('role')
  public removeRole(@UserDecorator('id') uuid: string, @Body() roleData: AdminRoleDTO): Promise<AdminUser> {
    return this.adminService.removeRole(uuid, roleData);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('verify')
  public verifyUser(@UserDecorator('id') uuid: string, @Body() verifyData: AdminVerifyDTO): Promise<AdminUser> {
    return this.adminService.verifyUser(uuid, verifyData);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete('verify')
  public unverifyUser(@UserDecorator('id') uuid: string, @Body() verifyData: AdminVerifyDTO): Promise<AdminUser> {
    return this.adminService.unverifyUser(uuid, verifyData);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('log')
  public getAdminLog(@UserDecorator('id') uuid: string): Promise<AdminLog[]> {
    return this.adminService.getAdminLog(uuid);
  }
}
