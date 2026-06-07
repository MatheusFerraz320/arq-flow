import { IsString, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  clientId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
