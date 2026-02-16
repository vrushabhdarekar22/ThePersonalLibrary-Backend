import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Book } from './book.entity';
import { CreateBookDto } from './dto/create-book.dto';

@Injectable() //this basically marks this class as Provider/service
export class BooksService {

  constructor(
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
  ) {}

  //2.create Book
  async create(createBookDto: CreateBookDto): Promise<Book> {

    const newBook = this.bookRepository.create({
      ...createBookDto,
    });

    return this.bookRepository.save(newBook);
  }

  //3.find All books(by genre)
  async findAll(
    genre?: string,
    search?: string,
    page: number = 1,
    limit: number = 6,
  ) {

    const query = this.bookRepository.createQueryBuilder('book');

    if (genre) {
      query.andWhere('LOWER(book.genre) = LOWER(:genre)', { genre });
    }

    if (search) {
      query.andWhere(
        '(LOWER(book.title) LIKE LOWER(:search) OR LOWER(book.author) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    const total = await query.getCount();

    const books = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data: books,
      total,
      page,
      totalPages,
    };
  }

  //4.update rating
  async updateRating(id: number, rating: number): Promise<Book> {

    const book = await this.bookRepository.findOne({
      where: { id },
    });

    if (!book) {
      throw new NotFoundException('book not found'); //throws 404 error
    }

    book.rating = rating;

    return this.bookRepository.save(book);
  }

  //5.delete book
  async remove(id: number): Promise<void> {

    const result = await this.bookRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Book not found');
    }
  }
}
