import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class ProjectPhotosService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, file: Express.Multer.File, caption?: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const lastPhoto = await this.prisma.projectPhoto.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
    });

    const url = `/uploads/projects/${file.filename}`;

    return this.prisma.projectPhoto.create({
      data: {
        projectId,
        url,
        caption,
        order: (lastPhoto?.order ?? -1) + 1,
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.projectPhoto.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });
  }

  async delete(projectId: string, photoId: string) {
    const photo = await this.prisma.projectPhoto.findFirst({
      where: { id: photoId, projectId },
    });

    if (!photo) {
      throw new NotFoundException('Foto não encontrada');
    }

    const filePath = join(process.cwd(), photo.url);
    try {
      await unlink(filePath);
    } catch {}

    await this.prisma.projectPhoto.delete({ where: { id: photoId } });
    return { message: 'Foto removida com sucesso' };
  }
}
