import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class ItemSet {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  rarity: string;
}
