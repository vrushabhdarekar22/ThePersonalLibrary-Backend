import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from './book.schema';
import { CreateBookDto } from './dto/create-book.dto';
import sampleBooks from './SampleData.json';
import { Borrow, BorrowDocument, BorrowStatus } from '../borrow/borrow.schema';

@Injectable()
export class BooksService implements OnModuleInit {
  constructor(
    @InjectModel(Book.name)
    private bookModel: Model<BookDocument>,

    @InjectModel(Borrow.name)
    private borrowModel: Model<BorrowDocument>,
  ) { }


  async onModuleInit() {
    const count = await this.bookModel.countDocuments();

    if (count === 0) {
      const booksWithInventory = sampleBooks.map((book) => ({
        ...book,
        availableCopies: book.totalCopies,
        isDeleted: false,
      }));

      await this.bookModel.insertMany(booksWithInventory);
    }
  }


  async create(createBookDto: CreateBookDto) {

    const existing = await this.bookModel.findOne({
      title: new RegExp(`^${createBookDto.title}$`, 'i'),
      author: new RegExp(`^${createBookDto.author}$`, 'i'),
    });

    // Case 1: Book already exists and active
    if (existing && !existing.isDeleted) {
      throw new BadRequestException('Book already exists');
    }

    // Case 2: Book exists but was soft deleted → Restore it
    if (existing && existing.isDeleted) {
      existing.isDeleted = false;
      existing.totalCopies = createBookDto.totalCopies;
      existing.availableCopies = createBookDto.totalCopies;
      existing.genre = createBookDto.genre;
      existing.rating = createBookDto.rating ?? existing.rating;

      return existing.save();
    }

    // Case 3: Completely new book
    const book = new this.bookModel({
      ...createBookDto,
      availableCopies: createBookDto.totalCopies,
      isDeleted: false,
    });

    return book.save();
  }


  async findAll(
    genre?: string,
    search?: string,
    page: number = 1,
    limit: number = 6,
  ) {
    const filter: any = {
      isDeleted: false,
    };

    if (genre) {
      filter.genre = new RegExp(`^${genre}$`, 'i');
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { author: new RegExp(search, 'i') },
      ];
    }

    const total = await this.bookModel.countDocuments(filter);

    const books = await this.bookModel
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data: books,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }


  async updateRating(id: string, rating: number) {
    const book = await this.bookModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    book.rating = rating;
    return book.save();
  }


  async remove(id: string) {
    const book = await this.bookModel.findById(id);

    if (!book || book.isDeleted) {
      throw new NotFoundException('Book not found');
    }


    const activeBorrow = await this.borrowModel.findOne({
      book: id,
      status: BorrowStatus.ISSUED,
    });

    if (activeBorrow) {
      throw new BadRequestException(
        'Cannot delete book while it is currently issued',
      );
    }

    book.isDeleted = true;
    await book.save();

    return { message: 'Book soft deleted successfully' };
  }
}