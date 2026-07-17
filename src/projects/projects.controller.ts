import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateUpdateDto } from './dto/create-update.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @Roles(Role.ARCHITECT)
  create(@Req() req, @Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(req.user.id, createProjectDto);
  }

  @Get()
  findAll(@Req() req) {
    return this.projectsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.projectsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @Roles(Role.ARCHITECT)
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() req,
  ) {
    return this.projectsService.update(id, updateProjectDto, req.user.id);
  }

  @Post(':projectId/updates')
  @Roles(Role.ARCHITECT)
  addUpdate(
    @Param('projectId') projectId: string,
    @Body() createUpdateDto: CreateUpdateDto,
    @Req() req,
  ) {
    return this.projectsService.addUpdate(projectId, req.user.id, createUpdateDto);
  }

  @Get(':projectId/updates')
  findUpdates(@Param('projectId') projectId: string, @Req() req) {
    return this.projectsService.findUpdates(projectId, req.user.id);
  }

  @Delete(':id')
  @Roles(Role.ARCHITECT)
  remove(@Param('id') id: string, @Req() req) {
    return this.projectsService.remove(id, req.user.id);
  }
}
