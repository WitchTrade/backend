import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Badge {
  @PrimaryColumn()
  id: string;

  @Column()
  description: string;
}
