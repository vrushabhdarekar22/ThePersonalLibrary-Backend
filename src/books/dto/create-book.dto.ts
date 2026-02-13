import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

//it is basically validates structure of book
export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsString()
  genre: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;
}
