import { Controller, Post, Delete, Get, Param, UseGuards, Request } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Roles(Role.USER)
  @Post(':bookId')
  addToFavorites(@Param('bookId') bookId: string, @Request() req) {
    return this.favoritesService.addToFavorites(req.user.userId, bookId);
  }

  @Roles(Role.USER)
  @Delete(':bookId')
  removeFromFavorites(@Param('bookId') bookId: string, @Request() req) {
    return this.favoritesService.removeFromFavorites(req.user.userId, bookId);
  }

  @Roles(Role.USER)
  @Get()
  getMyFavorites(@Request() req) {
    return this.favoritesService.getMyFavorites(req.user.userId);
  }
}
