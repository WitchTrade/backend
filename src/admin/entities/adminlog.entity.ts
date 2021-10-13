import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, Column } from 'typeorm';

@Entity()
export class AdminLog {
  @PrimaryGeneratedColumn()
  id: string;

  @CreateDateColumn()
  timestamp: Date;

  @ManyToOne(() => User)
  user: User;

  @Column()
  actionGroup: ACTIONGROUP;

  @Column()
  actionType: ACTIONTYPE;

  @ManyToOne(() => User)
  targetUser: User;

  @Column()
  log: string;
}

export enum ACTIONGROUP {
  BAN,
  ROLES,
  BADGES,
  VERIFY
}

export enum ACTIONTYPE {
  POST,
  PUT,
  DELETE
}