import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

import { Item } from '../../items/entities/item.entity';
import { Inventory } from './inventory.entity';

@Entity()
export class InventoryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Inventory)
  inventory: Inventory;

  @ManyToOne(() => Item)
  item: Item;

  @Column()
  amount: number;
}
