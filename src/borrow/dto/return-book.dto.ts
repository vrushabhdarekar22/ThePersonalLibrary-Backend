import { IsString, IsNotEmpty } from 'class-validator';

export class ReturnBookDto {
  @IsString()
  @IsNotEmpty()
  borrowId: string;
}