import { IsArray, IsBoolean, IsIn, IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';
import { Item } from 'src/items/entities/item.entity';
import { Price } from 'src/markets/entities/price.entity';

export class SyncSettingsUpdateDTO {
  @IsBoolean()
  syncInventory: boolean;

  @IsBoolean()
  syncMarket: boolean;

  @IsString()
  @IsIn([
    'both',
    'new',
    'existing'
  ])
  mode: string;

  @IsNumber()
  @Min(1)
  @Max(31)
  rarity: number;

  @IsObject()
  mainPriceItem: Price;

  @IsNumber()
  @Min(1)
  @Max(99)
  mainPriceAmountItem: number;

  @IsBoolean()
  wantsBothItem: boolean;

  @IsOptional()
  @IsObject()
  secondaryPriceItem: Price;

  @IsNumber()
  @Min(1)
  @Max(99)
  secondaryPriceAmountItem: number;

  @IsOptional()
  @IsObject()
  mainPriceRecipe: Price;

  @IsNumber()
  @Min(1)
  @Max(99)
  mainPriceAmountRecipe: number;

  @IsBoolean()
  wantsBothRecipe: boolean;

  @IsOptional()
  @IsObject()
  secondaryPriceRecipe: Price;

  @IsNumber()
  @Min(1)
  @Max(99)
  secondaryPriceAmountRecipe: number;

  @IsNumber()
  @Min(0)
  @Max(99)
  keepItem: number;

  @IsNumber()
  @Min(0)
  @Max(99)
  keepRecipe: number;

  @IsBoolean()
  ignoreWishlistItems: boolean;

  @IsBoolean()
  removeNoneOnStock: boolean;

  @IsArray()
  ignoreList: Item[];
}
