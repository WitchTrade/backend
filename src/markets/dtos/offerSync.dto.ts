import { IsBoolean, IsIn, IsNumber, IsString, Max, Min } from 'class-validator';

export class OfferSyncDTO {
  @IsString()
  @IsIn([
    'both',
    'new',
    'existing'
  ])
  ms_mode: string;

  @IsNumber()
  @Min(1)
  @Max(31)
  ms_rarity: number;

  @IsNumber()
  @Min(1)
  @Max(99)
  ms_defaultPriceItem: number;

  @IsNumber()
  @Min(1)
  @Max(99)
  ms_defaultPriceRecipe: number;

  @IsNumber()
  @Min(0)
  @Max(99)
  ms_keepItem: number;

  @IsNumber()
  @Min(0)
  @Max(99)
  ms_keepRecipe: number;

  @IsBoolean()
  ms_ignoreWishlistItems: boolean;

  @IsBoolean()
  ms_removeNoneOnStock: boolean;
}
