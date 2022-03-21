import { Module } from '@nestjs/common';
import { GameserversController } from './gameservers.controller';
import { GameserversService } from './gameservers.service';

@Module({
  controllers: [GameserversController],
  providers: [GameserversService],
})
export class GameserversModule {}
