import { IsEmail, IsEnum, IsOptional, IsString, MinLength , IsNotEmpty } from 'class-validator';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
