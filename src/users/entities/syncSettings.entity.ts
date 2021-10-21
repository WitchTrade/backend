import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SyncSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  syncInventory: boolean;

  @Column({ default: false })
  syncMarket: boolean;

  @Column({ default: 'both' })
  ms_mode: string;

  @Column({ default: 31 })
  ms_rarity: number;

  @Column({ default: 4 })
  ms_defaultPriceItem: number;

  @Column({ default: 2 })
  ms_defaultPriceRecipe: number;

  @Column({ default: 1 })
  ms_keepItem: number;

  @Column({ default: 0 })
  ms_keepRecipe: number;

  @Column({ default: true })
  ms_ignoreWishlistItems: boolean;

  @Column({ default: true })
  ms_removeNoneOnStock: boolean;
}

export enum RARITY {
  WHIMSICAL,
  VERYRARE,
  RARE,
  UNCOMMON,
  COMMON
}
