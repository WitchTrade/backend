import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { SteamController } from './steam.controller';
import { SteamAuthService } from './steamAuth.service';
import { WitchItModule } from 'src/witchit/witchit.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), HttpModule, WitchItModule],
  controllers: [SteamController],
  providers: [SteamAuthService],
})
export class SteamModule {}
