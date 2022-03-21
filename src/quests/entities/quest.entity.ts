import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Quest {
  @PrimaryColumn()
  id: number;

  @Column()
  string: string;
}
