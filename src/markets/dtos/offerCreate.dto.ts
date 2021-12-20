import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class OfferCreateDTO {
  @IsNumber()
  itemId: number;

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
  @IsBoolean()
  wantsBoth: boolean;

  @IsOptional()
  @IsNumber()
  secondaryPriceId: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  secondaryPriceAmount: number;
}
