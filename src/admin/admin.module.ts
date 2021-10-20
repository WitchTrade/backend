import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../users/entities/role.entity';
import { Badge } from '../users/entities/badge.entity';
import { User } from '../users/entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminLog } from './entities/adminlog.entity';
import { Notification } from '../notifications/entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Badge, Role, AdminLog, Notification])],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule { }
