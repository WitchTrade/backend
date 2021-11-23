import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class WishUpdateDTO {
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
