import { IsNumber, IsOptional } from 'class-validator';

export class WishCreateDTO {
  @IsNumber()
  itemId: number;

  @IsNumber()
  mainPriceId: number;

  @IsOptional()
  @IsNumber()
  mainPriceAmount: number;

  @IsOptional()
  @IsNumber()
  secondaryPriceId: number;

  @IsOptional()
  @IsNumber()
  secondaryPriceAmount: number;
}
