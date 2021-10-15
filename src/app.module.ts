import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import 'dotenv/config';

import { User } from './users/entities/user.entity';
import { AdminModule } from './admin/admin.module';
import { Role } from './users/entities/role.entity';
import { Badge } from './users/entities/badge.entity';
import { AdminLog } from './admin/entities/adminlog.entity';
import { ItemsModule } from './items/items.module';
import { Item } from './items/entities/item.entity';
import { ItemSet } from './items/entities/itemSet.entity';
import { GameserversModule } from './gameservers/gameservers.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASEHOST,
      port: parseInt(process.env.DATABASEPORT, 10),
      username: process.env.DATABASEUSER,
      password: process.env.DATABASEPW,
      database: 'witchtrade',
      entities: [
        User,
        Role,
        Badge,
        AdminLog,
        Item,
        ItemSet
      ],
      synchronize: true,
    }),
    UsersModule,
    AdminModule,
    ItemsModule,
    GameserversModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
