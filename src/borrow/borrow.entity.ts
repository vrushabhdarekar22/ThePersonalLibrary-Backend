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
  REQUESTED = 'requested',
  ISSUED = 'issued',
  RETURNED = 'returned',
  DECLINED = 'declined',
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
    default: BorrowStatus.REQUESTED,
  })
  status: BorrowStatus;

}
