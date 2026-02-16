import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BorrowController } from './borrow.controller';
import { BorrowService } from './borrow.service';
import { Borrow } from './borrow.entity';
import { Book } from '../books/book.entity';
import { User } from '../auth/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Borrow, Book, User]),
  ],
  controllers: [BorrowController],
  providers: [BorrowService],
})
export class BorrowModule {}
