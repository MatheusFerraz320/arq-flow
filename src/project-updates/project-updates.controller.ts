import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ProjectUpdatesService } from './project-updates.service';
import { CreateUpdateDto } from './dto/create-update.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller('projects/:projectId/updates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectUpdatesController {
  constructor(private projectUpdatesService: ProjectUpdatesService) {}

  @Post()
  @Roles(Role.ARCHITECT)
  create(
    @Param('projectId') projectId: string,
    @Body() createUpdateDto: CreateUpdateDto,
  ) {
    return this.projectUpdatesService.create(projectId, createUpdateDto);
  }

  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.projectUpdatesService.findByProject(projectId);
  }
}
