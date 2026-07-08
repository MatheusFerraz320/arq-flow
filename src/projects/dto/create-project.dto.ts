import { IsString, IsOptional , IsNotEmpty , IsNumber} from 'class-validator';
import { Transform } from 'class-transformer';
import { ProjectType } from '@prisma/client';


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

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(ProjectType)
  type?: ProjectType;  
}
