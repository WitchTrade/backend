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
  ADMIN,
  BAN,
  ROLES,
  BADGES,
  VERIFY,
  LOG
}
