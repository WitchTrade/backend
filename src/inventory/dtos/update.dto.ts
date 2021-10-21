import { IsBoolean } from 'class-validator';

export class InventoryUpdateDTO {
  @IsBoolean()
  showInTrading: boolean;
}
