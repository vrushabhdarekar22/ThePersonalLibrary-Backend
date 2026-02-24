import { IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRatingDto {

  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

}