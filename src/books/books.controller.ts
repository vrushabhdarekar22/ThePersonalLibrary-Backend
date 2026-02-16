import {Controller,Get,Post,Body,Param,Query,Patch,Delete,ParseIntPipe,} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@UseGuards(JwtAuthGuard,RolesGuard)
@Controller('books')//it is just like base route books/
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  findAll(
    @Query('genre') genre?: string,
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '6',
  ) {
    return this.booksService.findAll(
      genre,
      search,
      Number(page),
      Number(limit),
    );
  }



  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  create(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':id')
  updateRating(
    @Param('id', ParseIntPipe) id: number,
    @Body('rating') rating: number,
  ) {
    return this.booksService.updateRating(id, rating);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.remove(id);
  }
}
