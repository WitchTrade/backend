import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Role {
  @PrimaryColumn()
  id: string;

  @Column()
  description: string;

  @Column()
  rank: number;
}
