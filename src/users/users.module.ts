import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SyncSettings } from './entities/syncSettings.entity';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, SyncSettings])],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule { }
