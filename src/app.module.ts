import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import 'dotenv/config';

import { User } from './users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASEHOST,
      port: parseInt(process.env.DATABASEPORT, 10),
      username: process.env.DATABASEUSER,
      password: process.env.DATABASEPW,
      database: 'witchtrade',
      entities: [User],
      synchronize: true,
    }),
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
