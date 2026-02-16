import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Book {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column()
  genre: string;

  @Column({ type: 'int', default: 0 })
  rating: number;

  @Column({ default: true })
  isAvailable: boolean;
}
