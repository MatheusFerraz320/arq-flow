import { IsEnum } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class UpdateProjectDto {
  @IsEnum(ProjectStatus)
  status: ProjectStatus;
}
