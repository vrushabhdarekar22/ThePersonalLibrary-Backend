import { IsString, IsNotEmpty } from 'class-validator';

export class RequestBookDto {
  @IsString()
  @IsNotEmpty()
  bookId: string;
}