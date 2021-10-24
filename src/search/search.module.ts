import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from 'src/markets/entities/offer.entity';
import { Wish } from 'src/markets/entities/wish.entity';
import { User } from 'src/users/entities/user.entity';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Offer, Wish])],
  controllers: [SearchController],
  providers: [SearchService]
})
export class SearchModule { }
