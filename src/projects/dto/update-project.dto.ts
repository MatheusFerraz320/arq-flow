import { IsEnum } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class UpdateProjectDto {
  // So pode ser um dos valores dentro do conjunto PRojectStatus
  //PostgreSQL Puro seria direto no banco com o CREATE TYPE "ProjectStatus" AS ENUM ('BRIEFING', 'PROJETO', 'REVISAO', 'CONCLUIDO'); 
  @IsEnum(ProjectStatus)
  status: ProjectStatus;
}


