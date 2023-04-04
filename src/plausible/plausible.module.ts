import { HttpModule } from '@nestjs/axios';
import { CacheModule, Module } from '@nestjs/common';
import { PlausibleController } from './plausible.controller';
import { PlausibleService } from './plausible.service';

@Module({
  imports: [CacheModule.register(), HttpModule],
  controllers: [PlausibleController],
  providers: [PlausibleService],
})
export class PlausibleModule {}
