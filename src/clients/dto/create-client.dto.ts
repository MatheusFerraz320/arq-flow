import { IsString, IsOptional, IsEmail , IsNotEmpty } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
