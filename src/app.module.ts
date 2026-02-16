import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BooksModule } from './books/books.module';
import { AuthModule } from './auth/auth.module';
import { BorrowModule } from './borrow/borrow.module';

@Module({
  imports: [
    // Database configuration
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'library.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // auto create tables (development only)
    }),

    BooksModule,
    AuthModule,
    BorrowModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
