import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUpdateDto } from './dto/create-update.dto';

@Injectable()
export class ProjectUpdatesService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, createUpdateDto: CreateUpdateDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return this.prisma.projectUpdate.create({
      data: {
        projectId,
        message: createUpdateDto.message,
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.projectUpdate.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
