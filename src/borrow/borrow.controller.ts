import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { BorrowService } from './borrow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

import { RequestBookDto } from './dto/request-book.dto';
import { ApproveRequestDto } from './dto/approve-request.dto';
import { DeclineRequestDto } from './dto/decline-request.dto';
import { ReturnBookDto } from './dto/return-book.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('borrow')
export class BorrowController {
  constructor(private readonly borrowService: BorrowService) {}

  // // Manager issues book
  // @Roles(Role.MANAGER)
  // @Post('issue')
  // issueBook(
  //   @Body() body: { bookId: string; userId: string },
  //   @Request() req,
  // ) {
  //   return this.borrowService.issueBook(
  //     body.bookId,
  //     body.userId,
  //     req.user.userId,
  //   );
  // }

  // Manager returns book
  @Roles(Role.MANAGER)
  @Post('return')
  returnBook(
    @Body() dto: ReturnBookDto,
  ) {
    return this.borrowService.returnBook(dto.borrowId);
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
    @Body() dto: RequestBookDto,
    @Request() req,
  ) {
    return this.borrowService.requestBook(
      dto.bookId,
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
    @Body() dto: ApproveRequestDto,
  ) {
    return this.borrowService.approveRequest(dto.borrowId);
  }

  // Manager declines request
  @Roles(Role.MANAGER)
  @Post('decline')
  declineRequest(
    @Body() dto: DeclineRequestDto,
  ) {
    return this.borrowService.declineRequest(dto.borrowId);
  }

  // Manager views issued books
  @Roles(Role.MANAGER)
  @Get('issued')
  getIssuedBooks(@Query('search') search?: string) {
    return this.borrowService.getIssuedBooks(search);
  }

  // Admin & Manager: User-wise borrow analytics
  @Roles(Role.ADMIN, Role.MANAGER)
  @Get('analytics/users')
  getUserBorrowAnalytics(@Query('search') search?: string) {
    return this.borrowService.getUserBorrowAnalytics(search);
  }

  // Admin & Manager: System summary
  @Roles(Role.ADMIN, Role.MANAGER)
  @Get('analytics/summary')
  getSystemSummary() {
    return this.borrowService.getSystemSummary();
  }

  @Roles(Role.USER, Role.MANAGER, Role.ADMIN)
  @Get(':id/fine')
  getFine(@Param('id') id: string) {
    return this.borrowService.calculateFine(id);
  }
}