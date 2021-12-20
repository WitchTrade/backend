import { Item } from '../../items/entities/item.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Market } from './market.entity';
import { Price } from './price.entity';

@Entity()
export class Offer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Market)
  market: Market;

  @ManyToOne(() => Item)
  item: Item;

  @Column()
  quantity: number;

  @ManyToOne(() => Price)
  mainPrice: Price;

  @Column({ nullable: true })
  mainPriceAmount: number;

  @Column({ nullable: true })
  wantsBoth: boolean;

  @ManyToOne(() => Price)
  secondaryPrice: Price;

  @Column({ nullable: true })
  secondaryPriceAmount: number;
}
