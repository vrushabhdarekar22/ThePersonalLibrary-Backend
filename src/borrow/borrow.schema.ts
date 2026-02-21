import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BorrowDocument = Borrow & Document;

export enum BorrowStatus {
  REQUESTED = 'requested',
  ISSUED = 'issued',
  RETURNED = 'returned',
  DECLINED = 'declined',
}

@Schema({ timestamps: true })
export class Borrow {

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Book', required: true })
  book: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  issuedBy: Types.ObjectId;

  @Prop({ enum: BorrowStatus, default: BorrowStatus.REQUESTED })
  status: BorrowStatus;

  // When manager approves
  @Prop({ default: null })
  issueDate: Date;

 
  @Prop({ default: null })
  dueDate: Date;

  // When returned
  @Prop({ default: null })
  returnDate: Date;

  // 10 per day
  @Prop({ default: 0 })
  fineAmount: number;
}


export const BorrowSchema = SchemaFactory.createForClass(Borrow);
