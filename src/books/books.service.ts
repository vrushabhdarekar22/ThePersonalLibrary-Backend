import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from './book.schema';
import { CreateBookDto } from './dto/create-book.dto';
import sampleBooks from './SampleData.json';

@Injectable()
export class BooksService implements OnModuleInit {

  constructor(
    @InjectModel(Book.name)
    private bookModel: Model<BookDocument>,
  ) {}

  // It Seed books when module initializes
  async onModuleInit() {
    const count = await this.bookModel.countDocuments();

    if (count === 0) {
      await this.bookModel.insertMany(sampleBooks);
      console.log('Sample books seeded successfully');
    }
  }

  async create(createBookDto: CreateBookDto) {
    return this.bookModel.create(createBookDto);
  }

  async findAll(
    genre?: string,
    search?: string,
    page: number = 1,
    limit: number = 6,
  ) {

    const filter: any = {};

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
    const book = await this.bookModel.findById(id);

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    book.rating = rating;
    return book.save();
  }

  async remove(id: string) {
    const result = await this.bookModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException('Book not found');
    }
  }
}
