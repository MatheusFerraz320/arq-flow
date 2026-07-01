import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createClientDto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        userId,
        name: createClientDto.name,
        email: createClientDto.email,
        phone: createClientDto.phone,
      },
    });
  }

  async update(id: string, userId: string, updateClientDto: UpdateClientDto) {
    try {
      return await this.prisma.client.update({
        where: { id, userId },
        data: {
          name: updateClientDto.name,
          email: updateClientDto.email,
          phone: updateClientDto.phone,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Client não encontrado');
        }
      }
      throw error;  // sem isso se não cair no if vai retornar bug silencioso
    }
  }

  async findAll(userId: string) {
    return this.prisma.client.findMany({
      where: { userId },
      include: {
        projects: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.client.findFirst({
      where: { id, userId },
      include: {
        projects: {
          include: {
            updates: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    try {
      return await this.prisma.client.delete({
        where: { id, userId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Cliente não encontrado');
        }
      }
      throw error;  // sem isso se não cair no if vai retornar bug silencioso
    }
  }
}
