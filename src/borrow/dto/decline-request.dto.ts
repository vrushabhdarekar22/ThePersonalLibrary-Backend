import { IsString, IsNotEmpty } from 'class-validator';

export class DeclineRequestDto {
  @IsString()
  @IsNotEmpty()
  borrowId: string;
}