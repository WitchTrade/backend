import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class OfferUpdateDTO {
  @IsNumber()
  @Min(0)
  @Max(10000)
  quantity: number;

  @IsNumber()
  mainPriceId: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  mainPriceAmount: number;

  @IsOptional()
  @IsNumber()
  secondaryPriceId: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  secondaryPriceAmount: number;
}
