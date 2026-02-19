import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/user.schema';
import { Book, BookDocument } from '../books/book.schema';
import { Borrow, BorrowDocument, BorrowStatus } from '../borrow/borrow.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    @InjectModel(Book.name)
    private bookModel: Model<BookDocument>,

    @InjectModel(Borrow.name)
    private borrowModel: Model<BorrowDocument>,
  ) {}

  async getDashboardStats() {
    const totalUsers = await this.userModel.countDocuments();
    const totalBooks = await this.bookModel.countDocuments();
    const totalIssued = await this.borrowModel.countDocuments({
      status: BorrowStatus.ISSUED,
    });
    const totalPending = await this.borrowModel.countDocuments({
      status: BorrowStatus.REQUESTED,
    });

    return {
      totalUsers,
      totalBooks,
      totalIssued,
      totalPending,
    };
  }
}
