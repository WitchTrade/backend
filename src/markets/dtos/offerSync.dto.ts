import { IsArray, IsBoolean, IsIn, IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';
import { Item } from 'src/items/entities/item.entity';
import { Price } from '../entities/price.entity';

export class OfferSyncDTO {
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

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  mainPriceAmountItem: number;

  @IsOptional()
  @IsBoolean()
  wantsBothItem: boolean;

  @IsOptional()
  @IsObject()
  secondaryPriceItem: Price;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  secondaryPriceAmountItem: number;

  @IsOptional()
  @IsObject()
  mainPriceRecipe: Price;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  mainPriceAmountRecipe: number;

  @IsOptional()
  @IsObject()
  secondaryPriceRecipe: Price;

  @IsOptional()
  @IsBoolean()
  wantsBothRecipe: boolean;

  @IsOptional()
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
