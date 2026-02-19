import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Borrow, BorrowDocument, BorrowStatus } from './borrow.schema';
import { Book, BookDocument } from '../books/book.schema';
import { User, UserDocument } from '../auth/user.schema';

@Injectable()
export class BorrowService {
  constructor(
    @InjectModel(Borrow.name)
    private borrowModel: Model<BorrowDocument>,

    @InjectModel(Book.name)
    private bookModel: Model<BookDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  // Manager directly issues book
  async issueBook(bookId: string, userId: string, managerId: string) {
    const book = await this.bookModel.findById(bookId);
    if (!book) throw new NotFoundException('Book not found');

    if (!book.isAvailable)
      throw new BadRequestException('Book is already issued');

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const manager = await this.userModel.findById(managerId);
    if (!manager) throw new NotFoundException('Manager not found');

    book.isAvailable = false;
    await book.save();

    return this.borrowModel.create({
      book: book._id,
      user: new Types.ObjectId(user._id),
      issuedBy: new Types.ObjectId(manager._id),
      status: BorrowStatus.ISSUED,
      issueDate: new Date(),
    });
  }

  // Return book
  async returnBook(borrowId: string) {
    const borrow = await this.borrowModel
      .findById(borrowId)
      .populate('book');

    if (!borrow) throw new NotFoundException('Borrow record not found');

    if (borrow.status === BorrowStatus.RETURNED)
      throw new BadRequestException('Book already returned');

    borrow.status = BorrowStatus.RETURNED;
    borrow.returnDate = new Date();

    const book = borrow.book as any;
    book.isAvailable = true;
    await book.save();

    return borrow.save();
  }

  //  User views own borrows
  async getMyBorrowedBooks(userId: string, status?: string) {
    const filter: any = {
      user: new Types.ObjectId(userId),
    };

    if (status) {
      filter.status = status;
    }

    return this.borrowModel
      .find(filter)
      .populate('book')
      .populate('issuedBy')
      .sort({ issueDate: -1 });
  }

  // Admin sees all borrows
  async getAllBorrows() {
    return this.borrowModel
      .find()
      .populate('book')
      .populate('user')
      .populate('issuedBy')
      .sort({ issueDate: -1 });
  }

  // User requests book
  async requestBook(bookId: string, userId: string) {
    const book = await this.bookModel.findById(bookId);
    if (!book) throw new NotFoundException('Book not found');

    if (!book.isAvailable)
      throw new BadRequestException('Book not available');

    return this.borrowModel.create({
      book: book._id,
      user: new Types.ObjectId(userId),
      status: BorrowStatus.REQUESTED,
    });
  }

  // Manager views pending requests
  async getPendingRequests() {
    return this.borrowModel
      .find({ status: BorrowStatus.REQUESTED })
      .populate('book')
      .populate('user');
  }

  //  Manager approves request
  async approveRequest(borrowId: string) {
    const borrow = await this.borrowModel
      .findById(borrowId)
      .populate('book');

    if (!borrow) throw new NotFoundException('Request not found');

    if (borrow.status !== BorrowStatus.REQUESTED)
      throw new BadRequestException('Invalid request');

    borrow.status = BorrowStatus.ISSUED;
    borrow.issueDate = new Date();

    const book = borrow.book as any;
    book.isAvailable = false;
    await book.save();

    return borrow.save();
  }

  // Manager declines request
  async declineRequest(borrowId: string) {
    const borrow = await this.borrowModel.findById(borrowId);
    if (!borrow) throw new NotFoundException('Request not found');

    borrow.status = BorrowStatus.DECLINED;

    return borrow.save();
  }

  //  Manager sees issued books
  async getIssuedBooks() {
    return this.borrowModel
      .find({ status: BorrowStatus.ISSUED })
      .populate('book')
      .populate('user');
  }

  //  User-wise Borrow Analytics
  async getUserBorrowAnalytics(search?: string) {
    const matchStage: any = {};

    if (search) {
      matchStage.$or = [
        { "userInfo.fullName": { $regex: search, $options: "i" } },
        { "userInfo.email": { $regex: search, $options: "i" } },
      ];
    }

    return this.borrowModel.aggregate([
      {
        $addFields: {
          userObjectId: {
            $cond: [
              { $eq: [{ $type: "$user" }, "string"] },
              { $toObjectId: "$user" },
              "$user"
            ]
          }
        }
      },
      {
        $group: {
          _id: "$userObjectId",
          totalBorrowed: { $sum: 1 },
          currentlyIssued: {
            $sum: {
              $cond: [
                { $eq: ["$status", BorrowStatus.ISSUED] },
                1,
                0
              ]
            }
          },
          totalReturned: {
            $sum: {
              $cond: [
                { $eq: ["$status", BorrowStatus.RETURNED] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },

      { $match: matchStage },

      {
        $project: {
          _id: 0,
          userId: "$_id",
          fullName: "$userInfo.fullName",
          email: "$userInfo.email",
          totalBorrowed: 1,
          currentlyIssued: 1,
          totalReturned: 1,   
        },
      },

      { $sort: { totalBorrowed: -1 } },
    ]);
  }



  // System Summary
  async getSystemSummary() {
    const totalIssued = await this.borrowModel.countDocuments({
      status: BorrowStatus.ISSUED,
    });

    const totalPending = await this.borrowModel.countDocuments({
      status: BorrowStatus.REQUESTED,
    });

    return {
      totalIssued,
      totalPending,
    };
  }



}
