import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

import { InventoryItem } from './inventoryItem.entity';

@Entity()
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  lastSynced: Date;

  @Column({ default: false })
  showInTrading: boolean;

  @OneToMany(() => InventoryItem, inventoryItem => inventoryItem.inventory)
  inventoryItems: InventoryItem[];
}
