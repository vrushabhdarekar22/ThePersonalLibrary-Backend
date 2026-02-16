import { Controller, Post, Body, UseGuards, Request ,Get ,Query} from '@nestjs/common';
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
    @Body() body: { bookId: number; userId: number },
    @Request() req,
  ) {
    return this.borrowService.issueBook(
      body.bookId,
      body.userId,
      req.user.userId, // manager issuing
    );
  }


    // Manager returns book
  @Roles(Role.MANAGER)
  @Post('return')
  returnBook(
    @Body() body: { borrowId: number },
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
        console.log("I am in controller");
        return this.borrowService.getAllBorrows();
    }




}
