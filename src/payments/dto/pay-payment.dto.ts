import { IsOptional, IsDateString } from 'class-validator';

export class PayPaymentDto {
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
