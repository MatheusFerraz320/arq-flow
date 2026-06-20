import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { ProjectPhotosService } from './project-photos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller('projects/:projectId/photos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectPhotosController {
  constructor(private projectPhotosService: ProjectPhotosService) {}

  @Post()
  @Roles(Role.ARCHITECT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/projects',
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname);
          const name = randomUUID() + ext;
          cb(null, name);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Apenas imagens são permitidas'), false);
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  create(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('caption') caption?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado');
    }
    return this.projectPhotosService.create(projectId, file, caption);
  }

  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.projectPhotosService.findByProject(projectId);
  }

  @Delete(':photoId')
  @Roles(Role.ARCHITECT)
  delete(
    @Param('projectId') projectId: string,
    @Param('photoId') photoId: string,
  ) {
    return this.projectPhotosService.delete(projectId, photoId);
  }
}
