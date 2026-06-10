import { IsString, IsOptional , isNotEmpty } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  clientId: string;

  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
