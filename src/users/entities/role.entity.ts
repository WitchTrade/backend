import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Role {
  @PrimaryColumn()
  id: string;

  @Column()
  description: string;

  @Column({
    unique: true,
  })
  rank: number;

  @Column()
  permissions: number;
}

export enum PERMISSION {
  ADMIN = 0,
  BAN = 1,
  ROLES = 2,
  BADGES = 3,
  VERIFY = 4
}
