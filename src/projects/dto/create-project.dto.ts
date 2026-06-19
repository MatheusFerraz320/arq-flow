import { IsString, IsOptional , IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProjectDto {
  @IsString()             //Required linked on client IsString + IsNotEmpty cover cases
  @IsNotEmpty()
  clientId: string;

  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
