import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ItemsService } from './items.service';

@ApiTags('items')
@Controller('items')
export class ItemsController {
  constructor(private readonly itemService: ItemsService) { }

  @Get()
  getAll() {
    return this.itemService.getAll();
  }

  @Get('sets')
  getSets() {
    return this.itemService.getSets();
  }

}
