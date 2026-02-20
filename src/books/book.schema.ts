import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BookDocument = Book & Document;

@Schema({ timestamps: true })
export class Book {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  author: string;

  @Prop({ required: true })
  genre: string;

  @Prop({ default: 3 })
  rating: number;

  @Prop({ required: true, min: 0 })
  totalCopies: number;

  @Prop({ required: true, min: 0 })
  availableCopies: number;
}

export const BookSchema = SchemaFactory.createForClass(Book);
