import { IsNumber, IsOptional, Min } from 'class-validator';

export class OfferUpdateDTO {
  @IsNumber()
  @Min(0)
  quantity: number;

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
