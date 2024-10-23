import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class SearchDTO {
  @IsOptional()
  itemId: number;

  @IsIn(['any', 'none', 'hunter', 'witch'])
  character: string;

  @IsIn([
    'any',
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
    'recipe',
  ])
  slot: string;

  @IsIn([
    'any',
    'none',
    'theater',
    'chinese newyear',
    'halloween',
    'halloween2018',
    'halloween2019',
    'halloween2020',
    'halloween2022',
    'halloween2023',
    'halloween2024',
    'plunderparty',
    'springfever',
    'summerevent',
    'winterdream',
    'winterdream witch',
    'winterdream2018',
    'winterdream2019',
    'winterdream2020',
    'winterdream2021',
    'winterdream2022',
    'winterdream2023',
    'witchforest',
    'mystic sands',
    'dreamland',
  ])
  event: string;

  @IsIn(['any', 'common', 'uncommon', 'rare', 'veryrare', 'whimsical'])
  rarity: string;

  @IsIn(['any', 'owned', 'duplicateown', 'notowned'])
  inventoryType: string;

  @IsBoolean()
  onlyWishlistItems: boolean;
}
