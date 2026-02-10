import { Injectable ,NotFoundException} from '@nestjs/common';
import {Book} from './book.interface';
import {CreateBookDto} from './dto/create-book.dto';

@Injectable()
export class BooksService {
    //1.here we`ll use in-memory array
    private books:Book[] = []; //at evry time we restart server it will start with empty

    //2.create Book
    create(createBookDto : CreateBookDto): Book {
        const newBook: Book = {
            id: Date.now(),
            title: createBookDto.title,
            author: createBookDto.author,
            genre: createBookDto.genre,
            rating: createBookDto.rating,
            isFavorite: false,
        }

        this.books.push(newBook);

        return newBook;
    };

    //3.find All books(by genre)
    findAll(genre?:string): Book[] {
        if(genre){
            return this.books.filter(
                (book) => book.genre.toLowerCase() === genre.toLowerCase()
            );
        }

        //if not by genre
        return this.books;
    }

    //4.update rating
    updateRating(id:number , rating:number): Book {
        const book = this.books.find((b) => b.id === id);

        if(!book){
            throw new NotFoundException('book not found'); //throws 404 error
        }

        book.rating = rating;
        return book;
    }

    //5.delete book
    remove(id:number):void {
        const index = this.books.findIndex((b) => b.id === id);

        if(index === -1) {
            throw new NotFoundException('Book not found');
        }

        this.books.splice(index,1);
    }
}
