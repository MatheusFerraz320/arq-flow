import { IsEnum } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class UpdateProjectDto {
  // So pode ser um dos valores dentro do conjunto PRojectStatus
  @IsEnum(ProjectStatus)
  status: ProjectStatus;
}


