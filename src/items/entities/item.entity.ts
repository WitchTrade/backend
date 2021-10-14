import { Entity, Column, PrimaryColumn, ManyToMany, JoinTable } from 'typeorm';
import { ItemSet } from './itemSet.entity';

@Entity()
export class Item {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  iconUrl: string;

  @Column()
  rarityColor: string;

  @Column()
  tradeable: boolean;

  @Column()
  tagRarity: string;

  @Column({ nullable: true })
  tagCharacter: string;

  @Column()
  tagSlot: string;

  @Column()
  tagType: string;

  @Column({ nullable: true })
  tagEvent: string;

  @Column()
  new: boolean;

  @ManyToMany(() => ItemSet)
  @JoinTable()
  itemSets: ItemSet[];
}
