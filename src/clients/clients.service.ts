import { Injectable } from '@nestjs/common';
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

  async update(id: string, updateClientDto: UpdateClientDto) {
    return this.prisma.client.update({
      where: { id },
      data: {
        name: updateClientDto.name,
        email: updateClientDto.email,
        phone: updateClientDto.phone,
      },
    });
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

  async findOne(id: string) {
    return this.prisma.client.findUnique({
      where: { id },
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

  async findByEmail(email: string) {
    return this.prisma.client.findFirst({
      where: { email },
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
}
