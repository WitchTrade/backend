import { IsNumber, IsOptional } from 'class-validator';

export class WishUpdateDTO {
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
