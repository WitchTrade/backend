import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { UserDecorator } from '../users/decorators/user.decorator';
import { InventoryUpdateDTO } from './dtos/update.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private _inventoryService: InventoryService) { }

  @UseGuards(AuthGuard)
  @Get('')
  getInventory(@UserDecorator('id') uuid: string) {
    return this._inventoryService.getInventory(uuid);
  }

  @UseGuards(AuthGuard)
  @Put('')
  updateInventory(@UserDecorator('id') uuid: string, @Body() data: InventoryUpdateDTO) {
    return this._inventoryService.updateInventory(data, uuid);
  }
}
