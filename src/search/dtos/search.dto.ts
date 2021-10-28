import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class SearchDTO {
  @IsOptional()
  itemId: number;

  @IsIn([
    'all',
    'none',
    'hunter',
    'witch'
  ])
  character: string;

  @IsIn([
    'all',
    'ingredient',
    'body',
    'hat',
    'head',
    'skin color',
    'player icon',
    'upper body',
    'lower body',
    'melee weapon',
    'projectile',
    'broom',
    'recipe'
  ])
  slot: string;

  @IsIn([
    'all',
    'none',
    'theater',
    'chinese newyear',
    'halloween',
    'halloween2018',
    'halloween2019',
    'halloween2020',
    'plunderparty',
    'springfever',
    'summerevent',
    'winterdream',
    'winterdream witch',
    'winterdream2018',
    'winterdream2019',
    'winterdream2020',
    'witchforest',
    'mystic sands'
  ])
  event: string;

  @IsIn([
    'all',
    'common',
    'uncommon',
    'rare',
    'veryrare',
    'whimsical'
  ])
  rarity: string;

  @IsIn([
    'all',
    'owned',
    'duplicateown',
    'notowned'
  ])
  inventoryType: string;

  @IsBoolean()
  onlyWishlistItems: boolean;
}
