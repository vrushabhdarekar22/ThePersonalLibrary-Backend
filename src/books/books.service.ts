import { Injectable ,NotFoundException} from '@nestjs/common';
import {Book} from './book.interface';
import {CreateBookDto} from './dto/create-book.dto';

@Injectable() //this basically marks this class as Provider/service
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
    findAll(
    genre?: string,
    search?: string,
    page: number = 1,
    limit: number = 6,
    ) {
        let filteredBooks = this.books;

        if (genre) {
            filteredBooks = filteredBooks.filter(
            (book) =>
                book.genre.toLowerCase() ===
                genre.toLowerCase(),
            );
        }

        if (search) {
            filteredBooks = filteredBooks.filter(
            (book) =>
                book.title.toLowerCase().includes(search.toLowerCase()) ||
                book.author.toLowerCase().includes(search.toLowerCase())
            );
        }

        const total = filteredBooks.length;
        const totalPages = Math.ceil(total / limit);

        const start = (page - 1) * limit;
        const end = start + limit;

        const paginatedBooks = filteredBooks.slice(start, end);

        return {
            data: paginatedBooks,
            total,
            page,
            totalPages,
        };
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
