import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Borrow, BorrowStatus } from './borrow.entity';
import { Book } from '../books/book.entity';
import { User } from '../auth/user.entity';

@Injectable()
export class BorrowService {

  constructor(
    @InjectRepository(Borrow)
    private borrowRepository: Repository<Borrow>,

    @InjectRepository(Book)
    private bookRepository: Repository<Book>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async issueBook(bookId: number, userId: number, managerId: number) {

    // 1. Find book
    const book = await this.bookRepository.findOne({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (!book.isAvailable) {
      throw new BadRequestException('Book is already issued');
    }

    // 2. Find user (borrower)
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 3. Find manager
    const manager = await this.userRepository.findOne({
      where: { id: managerId },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    // 4. Mark book unavailable
    book.isAvailable = false;
    await this.bookRepository.save(book);

    // 5. Create borrow record
    const borrow = this.borrowRepository.create({
      book,
      user,
      issuedBy: manager,
      status: BorrowStatus.ISSUED,
    });

    return this.borrowRepository.save(borrow);
  }



    async returnBook(borrowId: number) {

    // 1. Find borrow record
    const borrow = await this.borrowRepository.findOne({
      where: { id: borrowId },
      relations: ['book'],
    });

    if (!borrow) {
      throw new NotFoundException('Borrow record not found');
    }

    if (borrow.status === BorrowStatus.RETURNED) {
      throw new BadRequestException('Book already returned');
    }

    // 2. Update borrow status
    borrow.status = BorrowStatus.RETURNED;
    borrow.returnDate = new Date();

    // 3. Make book available again
    borrow.book.isAvailable = true;
    await this.bookRepository.save(borrow.book);

    return this.borrowRepository.save(borrow);
  }


    //logic for user can view their borrowd books
    async getMyBorrowedBooks(userId: number, status?: string) {

    const query = this.borrowRepository.createQueryBuilder('borrow')
        .leftJoinAndSelect('borrow.book', 'book')
        .leftJoinAndSelect('borrow.issuedBy', 'issuedBy')
        .where('borrow.userId = :userId', { userId });

    if (status) {
        query.andWhere('borrow.status = :status', { status });
    }

    return query
        .orderBy('borrow.issueDate', 'DESC')
        .getMany();
    }



    async getAllBorrows() {
        return this.borrowRepository.find({
        relations: ['book', 'user', 'issuedBy'],
        order: {
            issueDate: 'DESC',
        },
        });
    }



    async requestBook(bookId: number, userId: number) {

      const book = await this.bookRepository.findOne({
        where: { id: bookId },
      });

      if (!book) {
        throw new NotFoundException('Book not found');
      }

      if (!book.isAvailable) {
        throw new BadRequestException('Book not available');
      }

      const borrow = this.borrowRepository.create({
        book,
        user: { id: userId },
        status: BorrowStatus.REQUESTED,
      });

      return this.borrowRepository.save(borrow);
  }



    async getPendingRequests() {
    return this.borrowRepository.find({
      where: { status: BorrowStatus.REQUESTED },
      relations: ['book', 'user'],
    });
  }


  async approveRequest(borrowId: number) {

    const borrow = await this.borrowRepository.findOne({
      where: { id: borrowId },
      relations: ['book'],
    });

    if (!borrow) {
      throw new NotFoundException('Request not found');
    }

    if (borrow.status !== BorrowStatus.REQUESTED) {
      throw new BadRequestException('Invalid request');
    }

    borrow.status = BorrowStatus.ISSUED;
    borrow.issueDate = new Date();

    borrow.book.isAvailable = false;
    await this.bookRepository.save(borrow.book);

    return this.borrowRepository.save(borrow);
  }



  async declineRequest(borrowId: number) {

    const borrow = await this.borrowRepository.findOne({
      where: { id: borrowId },
    });

    if (!borrow) {
      throw new NotFoundException('Request not found');
    }

    borrow.status = BorrowStatus.DECLINED;

    return this.borrowRepository.save(borrow);
  }






}
