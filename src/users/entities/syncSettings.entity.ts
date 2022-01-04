import { Item } from 'src/items/entities/item.entity';
import { Price } from 'src/markets/entities/price.entity';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SyncSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  syncInventory: boolean;

  @Column({ default: false })
  syncMarket: boolean;

  @Column({ default: 'both' })
  mode: string;

  @Column({ default: 31 })
  rarity: number;

  @ManyToOne(() => Price)
  mainPriceItem: Price;

  @Column({ default: 4, nullable: true })
  mainPriceAmountItem: number;

  @ManyToOne(() => Price)
  secondaryPriceItem: Price;

  @Column({ nullable: true })
  secondaryPriceAmountItem: number;

  @ManyToOne(() => Price)
  mainPriceRecipe: Price;

  @Column({ default: 2, nullable: true })
  mainPriceAmountRecipe: number;

  @ManyToOne(() => Price)
  secondaryPriceRecipe: Price;

  @Column({ nullable: true })
  secondaryPriceAmountRecipe: number;

  @Column({ default: 1 })
  keepItem: number;

  @Column({ default: 0 })
  keepRecipe: number;

  @Column({ default: true })
  ignoreWishlistItems: boolean;

  @Column({ default: false })
  removeNoneOnStock: boolean;

  @ManyToMany(() => Item)
  @JoinTable()
  ignoreList: Item[];
}

export enum RARITY {
  WHIMSICAL = 'whimsical',
  VERYRARE = 'veryrare',
  RARE = 'rare',
  UNCOMMON = 'uncommon',
  COMMON = 'common'
}
