import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class WishCreateDTO {
  @IsNumber()
  itemId: number;

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
