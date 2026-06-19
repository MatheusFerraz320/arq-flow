import { IsString, IsOptional, IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateClientDto {

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value
  )
  @IsNotEmpty()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  phone?: string;
}