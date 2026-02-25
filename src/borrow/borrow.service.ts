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


  // Return book
  async returnBook(borrowId: string) {
    const borrow = await this.borrowModel.findById(borrowId);

    if (!borrow) {
      throw new NotFoundException('Borrow record not found');
    }

    if (borrow.status !== BorrowStatus.ISSUED) {
      throw new BadRequestException('Book is not currently issued');
    }

    const book = await this.bookModel.findOne({
      _id: borrow.book,
      isDeleted: false,
    });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.availableCopies >= book.totalCopies) {
      throw new BadRequestException('Invalid return operation');
    }

    book.availableCopies += 1;
    await book.save();

    borrow.status = BorrowStatus.RETURNED;

    const now = new Date();
    borrow.returnDate = now;

    // Fine calculation
    if (borrow.dueDate && now > borrow.dueDate) {
      const diffTime = now.getTime() - borrow.dueDate.getTime();
      const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      borrow.fineAmount = daysLate * 10;
    } else {
      borrow.fineAmount = 0;
    }

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

    if (!book || book.isDeleted) {
      throw new NotFoundException('Book not found');
    }

    if (book.availableCopies <= 0) {
      throw new BadRequestException('Book is out of stock');
    }

    const existing = await this.borrowModel.findOne({
      user: new Types.ObjectId(userId),
      book: new Types.ObjectId(bookId),
      status: { $in: [BorrowStatus.REQUESTED, BorrowStatus.ISSUED]},
    });

    if (existing) {
      throw new BadRequestException(
        'You already requested or borrowed this book',
      );
    }

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
      .populate({
        path: 'book',
        match: { isDeleted: false },
      })
      .populate('user');
  }

  //  Manager approves request
  async approveRequest(borrowId: string) {
    const borrow = await this.borrowModel.findById(borrowId);

    if (!borrow) {
      throw new NotFoundException('Request not found');
    }

    if (borrow.status !== BorrowStatus.REQUESTED) {
      throw new BadRequestException('Invalid request');
    }

    const book = await this.bookModel.findOne({
      _id: borrow.book,
      isDeleted: false,
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.availableCopies <= 0) {
      throw new BadRequestException('Book is out of stock');
    }

    book.availableCopies -= 1;
    await book.save();

    borrow.status = BorrowStatus.ISSUED;

    const now = new Date();
    borrow.issueDate = now;

    const due = new Date();
    due.setDate(now.getDate() + 7);
    borrow.dueDate = due;

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
  async getIssuedBooks(search?: string) {
    const matchStage: any = {
      status: BorrowStatus.ISSUED,
    };

    const pipeline: any[] = [
      { $match: matchStage },

      {
        $lookup: {
          from: 'books',
          localField: 'book',
          foreignField: '_id',
          as: 'book',
        },
      },
      { $unwind: '$book' },

      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $match: {
          'book.isDeleted': false,
        },
      },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'book.title': { $regex: search, $options: 'i' } },
            { 'user.email': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push({
      $sort: { issueDate: -1 },
    });

    return this.borrowModel.aggregate(pipeline);
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
              { $eq: [{ $type: "$user" }, "string"] }, //condn
              { $toObjectId: "$user" }, //if true
              "$user" //if false  
            ]
          }
        }
      },
      {
        $group: {
          _id: "$userObjectId",
          totalBorrowed: { $sum: 1 }, // for each record add 1 to sum
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
      { // similar to join in sql
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" }, // removes array wrapper []

      { $match: matchStage },

      {
        $project: {
          _id: 0,//0-> not include
          userId: "$_id",
          fullName: "$userInfo.fullName",
          email: "$userInfo.email",
          totalBorrowed: 1,//1->include in final result
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

    // 1 Total Fine Collected (All Time)
    const fineResult = await this.borrowModel.aggregate([
      { $match: { status: BorrowStatus.RETURNED } },
      {
        $group: {
          _id: null,
          totalFineCollected: { $sum: "$fineAmount" },
        },
      },
    ]);

    const totalFineCollected =
      fineResult.length > 0 ? fineResult[0].totalFineCollected : 0;

    // This Month Fine
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyFineResult = await this.borrowModel.aggregate([
      {
        $match: {
          status: BorrowStatus.RETURNED,
          returnDate: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          monthlyFine: { $sum: "$fineAmount" },
        },
      },
    ]);

    const monthlyFine =
      monthlyFineResult.length > 0 ? monthlyFineResult[0].monthlyFine : 0;

    // Outstanding Fine (Issued & Late)
    const issuedBorrows = await this.borrowModel.find({
      status: BorrowStatus.ISSUED,
    });

    let outstandingFine = 0;
    const now = new Date();

    for (const borrow of issuedBorrows) {
      if (borrow.dueDate && now > borrow.dueDate) {
        const diffTime = now.getTime() - borrow.dueDate.getTime();
        const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        outstandingFine += daysLate * 10;
      }
    }

    return {
      totalIssued,
      totalPending,
      totalFineCollected,
      monthlyFine,
      outstandingFine,
    };
  }

  //dynamic fine calculation -> current fine
  async calculateFine(borrowId: string) {
    const borrow = await this.borrowModel.findById(borrowId);

    if (!borrow) {
      throw new NotFoundException('Borrow record not found');
    }

    if (!borrow.issueDate || !borrow.dueDate) {
      return {
        borrowId: borrow._id,
        fine: 0,
        daysLate: 0,
      };
    }

    const now = new Date();
    const comparisonDate = borrow.returnDate || now;

    let daysLate = 0;
    let fine = 0;

    if (comparisonDate > borrow.dueDate) {
      const diffTime = comparisonDate.getTime() - borrow.dueDate.getTime();
      daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fine = daysLate * 10;
    }

    return {
      borrowId: borrow._id,
      fine,
      daysLate,
    };
  }



}
