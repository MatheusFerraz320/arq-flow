import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  paidAt?: string;
}
