import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from 'src/markets/entities/offer.entity';
import { User } from 'src/users/entities/user.entity';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Offer])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
