import { Item } from '../../items/entities/item.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Market } from './market.entity';
import { Price } from './price.entity';

@Entity()
export class Wish {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Market)
  market: Market;

  @ManyToOne(() => Item)
  item: Item;

  @ManyToOne(() => Price)
  mainPrice: Price;

  @Column({ nullable: true })
  mainPriceAmount: number;

  @ManyToOne(() => Price)
  secondaryPrice: Price;

  @Column({ nullable: true })
  secondaryPriceAmount: number;
}
