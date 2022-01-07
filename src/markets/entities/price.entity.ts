import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Price {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  priceKey: string;

  @Column()
  displayName: string;

  @Column()
  withAmount: boolean;

  @Column()
  forOffers: boolean;

  @Column()
  forWishes: boolean;

  @Column()
  forSync: boolean;

  @Column()
  canBeMain: boolean;
}
