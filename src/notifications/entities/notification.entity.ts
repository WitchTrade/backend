import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created: Date;

  @Column()
  text: string;

  @Column({ nullable: true })
  link: string;

  @Column({ nullable: true })
  iconLink: string;

  @ManyToOne(() => User)
  user: User;
}
