import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BorrowController } from './borrow.controller';
import { BorrowService } from './borrow.service';
import { Borrow, BorrowSchema } from './borrow.schema';
import { Book, BookSchema } from '../books/book.schema';
import { User, UserSchema } from '../auth/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Borrow.name, schema: BorrowSchema },
      { name: Book.name, schema: BookSchema },   
      { name: User.name, schema: UserSchema },    
    ]),
  ],
  controllers: [BorrowController],
  providers: [BorrowService],
})
export class BorrowModule {}
