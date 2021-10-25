import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Stats {
    @PrimaryColumn()
    statGroup: string;

    @PrimaryColumn()
    dataset: string;

    @PrimaryColumn()
    label: string;

    @Column()
    value: string;
}
