import { Controller, Get } from '@nestjs/common';
import { ItemsService } from './items.service';

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
