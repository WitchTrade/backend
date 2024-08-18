import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { OAuthController } from './oauth.controller';
import { SteamService } from './steam.service';
import { WitchItModule } from 'src/witchit/witchit.module';
import { EpicService } from 'src/oauth/epic.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), WitchItModule],
  controllers: [OAuthController],
  providers: [SteamService, EpicService],
})
export class OAuthModule {}
