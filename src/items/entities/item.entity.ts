import { Entity, Column, PrimaryColumn } from 'typeorm';

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
}
