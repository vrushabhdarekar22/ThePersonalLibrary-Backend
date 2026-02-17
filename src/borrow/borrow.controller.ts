import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
} from '@nestjs/common';
import { BorrowService } from './borrow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('borrow')
export class BorrowController {
  constructor(private readonly borrowService: BorrowService) {}

  // Manager issues book
  @Roles(Role.MANAGER)
  @Post('issue')
  issueBook(
    @Body() body: { bookId: string; userId: string }, // ✅ changed
    @Request() req,
  ) {
    return this.borrowService.issueBook(
      body.bookId,
      body.userId,
      req.user.userId,
    );
  }

  // Manager returns book
  @Roles(Role.MANAGER)
  @Post('return')
  returnBook(
    @Body() body: { borrowId: string }, // ✅ changed
  ) {
    return this.borrowService.returnBook(body.borrowId);
  }

  // User views their own borrowed books
  @Get('my')
  @Roles(Role.USER)
  getMyBorrowedBooks(
    @Request() req,
    @Query('status') status?: string,
  ) {
    return this.borrowService.getMyBorrowedBooks(
      req.user.userId,
      status,
    );
  }

  // Admin views all borrow records
  @Roles(Role.ADMIN)
  @Get('all')
  getAllBorrows() {
    return this.borrowService.getAllBorrows();
  }

  // User requests a book
  @Roles(Role.USER)
  @Post('request')
  requestBook(
    @Body() body: { bookId: string }, // ✅ changed
    @Request() req,
  ) {
    return this.borrowService.requestBook(
      body.bookId,
      req.user.userId,
    );
  }

  // Manager views pending requests
  @Roles(Role.MANAGER)
  @Get('requests')
  getPendingRequests() {
    return this.borrowService.getPendingRequests();
  }

  // Manager approves request
  @Roles(Role.MANAGER)
  @Post('approve')
  approveRequest(
    @Body() body: { borrowId: string }, // ✅ changed
  ) {
    return this.borrowService.approveRequest(body.borrowId);
  }

  // Manager declines request
  @Roles(Role.MANAGER)
  @Post('decline')
  declineRequest(
    @Body() body: { borrowId: string }, // ✅ changed
  ) {
    return this.borrowService.declineRequest(body.borrowId);
  }

  // Manager views issued books
  @Roles(Role.MANAGER)
  @Get('issued')
  getIssuedBooks() {
    return this.borrowService.getIssuedBooks();
  }
}
