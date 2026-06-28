import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createProjectDto: CreateProjectDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: createProjectDto.clientId, userId },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return this.prisma.project.create({
      data: {
        clientId: createProjectDto.clientId,
        budget: createProjectDto.budget,
        startDate: createProjectDto.startDate,
        dueDate: createProjectDto.dueDate,
        title: createProjectDto.title,
        description: createProjectDto.description,
      },
      include: {
        client: true,
        photos: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findAll(userId: string, role: string) {
      return this.prisma.project.findMany({
        where: {
          client: { userId },
        },
        include: {
          client: true,
          photos: {
            orderBy: { order: 'asc' },
          },
          updates: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        photos: {
          orderBy: { order: 'asc' },
        },
        updates: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const data: Record<string, unknown> = {};
    if (updateProjectDto.status !== undefined) data.status = updateProjectDto.status;
    if (updateProjectDto.budget !== undefined) data.budget = updateProjectDto.budget;
    if (updateProjectDto.startDate !== undefined) data.startDate = updateProjectDto.startDate;
    if (updateProjectDto.dueDate !== undefined) data.dueDate = updateProjectDto.dueDate;

    return this.prisma.project.update({
      where: { id },
      data,
      include: {
        client: true,
        photos: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }
}
