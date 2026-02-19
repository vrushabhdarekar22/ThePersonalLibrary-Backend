import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Favorite, FavoriteDocument } from './favorites.schema';
import { Book, BookDocument } from '../books/book.schema';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name)
    private favoriteModel: Model<FavoriteDocument>,

    @InjectModel(Book.name)
    private bookModel: Model<BookDocument>,
  ) {}

  // Add to favorites
  async addToFavorites(userId: string, bookId: string) {
    const book = await this.bookModel.findById(bookId);
    if (!book) throw new NotFoundException('Book not found');

    try {
      return await this.favoriteModel.create({
        user: new Types.ObjectId(userId),
        book: new Types.ObjectId(bookId),
      });
    } catch (err) {
      throw new BadRequestException('Book already in favorites');
    }
  }

  // Remove from favorites
  async removeFromFavorites(userId: string, bookId: string) {
    return this.favoriteModel.deleteOne({
      user: new Types.ObjectId(userId),
      book: new Types.ObjectId(bookId),
    });
  }

  // Get my favorites
  async getMyFavorites(userId: string) {
    return this.favoriteModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('book')
      .sort({ createdAt: -1 });
  }
}
