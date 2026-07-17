import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, userId: string, createPaymentDto: CreatePaymentDto) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        client: { userId },
      },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return this.prisma.payment.create({
      data: {
        projectId,
        description: createPaymentDto.description,
        amount: createPaymentDto.amount,
        dueDate: new Date(createPaymentDto.dueDate),
        paidAt: createPaymentDto.paidAt ? new Date(createPaymentDto.paidAt) : null,
      },
    });
  }

  async findByProject(projectId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        client: { userId },
      },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return this.prisma.payment.findMany({
      where: { projectId },
      orderBy: { dueDate: 'asc' },
    });
  }

  async pay(id: string, userId: string, paidAt?: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        project: {
          client: { userId },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    return this.prisma.payment.update({
      where: { id },
      data: {
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        status: 'PAID',
      },
    });
  }

  async remove(id: string, userId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        project: {
          client: { userId },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    return this.prisma.payment.delete({
      where: { id },
    });
  }
}
