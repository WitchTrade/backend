import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { WitchItService } from './witchIt.service';

@Module({
  imports: [HttpModule],
  providers: [WitchItService],
  exports: [WitchItService],
})
export class WitchItModule {}
