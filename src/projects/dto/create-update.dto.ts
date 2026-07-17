import { IsString, MinLength } from 'class-validator';

export class CreateUpdateDto {
  @IsString()
  @MinLength(3)
  message: string;
}
