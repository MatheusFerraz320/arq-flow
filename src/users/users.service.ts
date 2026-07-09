import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.findByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.role,
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async uploadPhoto(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (user?.photo) {
      const oldPath = join(process.cwd(), user.photo);
      try { await unlink(oldPath); } 
      catch {
        console.warn('user photo not found to delete');
      }
    }

    const url = `/uploads/users/${file.filename}`;

    return this.prisma.user.update({
      where: { id: userId },
      data: { photo: url },
      select: { id: true, name: true, email: true, photo: true, role: true },
    });
  }
}
