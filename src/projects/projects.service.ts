import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Prisma } from '@prisma/client';


@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createProjectDto: CreateProjectDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: createProjectDto.clientId, userId },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado'); //sem cliente sem projeto
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
    try {
      const { message, ...fields } = updateProjectDto;

      const data: Record<string, unknown> = {};
      if (fields.status !== undefined) data.status = fields.status;
      if (fields.budget !== undefined) data.budget = fields.budget;
      if (fields.startDate !== undefined) data.startDate = fields.startDate;
      if (fields.dueDate !== undefined) data.dueDate = fields.dueDate;

      if (message) {
        await this.prisma.projectUpdate.create({
          data: { projectId: id, message },
        });
      }

      return this.prisma.project.update({
        where: { id },
        data,
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
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            throw new NotFoundException('Projeto nao encontrado');
          }
        }
        throw error;  
      }
  }
}
