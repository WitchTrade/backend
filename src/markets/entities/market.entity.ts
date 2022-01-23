import { User } from '../../users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, OneToOne } from 'typeorm';
import { Offer } from './offer.entity';
import { Wish } from './wish.entity';

@Entity()
export class Market {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, length: 300 })
  offerlistNote: string;

  @Column({ nullable: true, length: 300 })
  wishlistNote: string;

  @Column()
  lastUpdated: Date;

  @OneToMany(() => Offer, offer => offer.market)
  offers: Offer[];

  @OneToMany(() => Wish, wish => wish.market)
  wishes: Wish[];

  @OneToOne(() => User, user => user.market)
  user: User;
}
