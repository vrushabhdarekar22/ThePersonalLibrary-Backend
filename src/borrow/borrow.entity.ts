import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { Book } from '../books/book.entity';

export enum BorrowStatus {
  ISSUED = 'issued',
  RETURNED = 'returned',
}

@Entity()
export class Borrow {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User; // the person who borrows

  @ManyToOne(() => User)
  issuedBy: User; // manager who issued

  @ManyToOne(() => Book)
  book: Book;

  @CreateDateColumn()
  issueDate: Date;

  @Column({ nullable: true })
  returnDate: Date;

  @Column({
    type: 'text',
    default: BorrowStatus.ISSUED,
  })
  status: BorrowStatus;
}
