import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { UserDecorator } from 'src/users/decorators/user.decorator';
import { User } from 'src/users/entities/user.entity';
import { AdminService } from './admin.service';
import { AdminBanDTO } from './dtos/ban.dto';
import { AdminUnbanDTO } from './dtos/unban.dto';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) { }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('users')
  public getUsers(@UserDecorator('id') uuid: string): Promise<Partial<User[]>> {
    return this.adminService.getUsers(uuid);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('ban')
  public banUser(@UserDecorator('id') uuid: string, @Body() banData: AdminBanDTO): Promise<Partial<User>> {
    return this.adminService.banUser(uuid, banData);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('unban')
  public unbanUser(@UserDecorator('id') uuid: string, @Body() unbanData: AdminUnbanDTO): Promise<Partial<User>> {
    return this.adminService.unbanUser(uuid, unbanData);
  }

  // add badge
  // remove badge

  // add role
  // remove role

  // verify user
  // un-verify user
}
