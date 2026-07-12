import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('me/photo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/users',
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname);
          cb(null, randomUUID() + ext);
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
  uploadPhoto(
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado');
    }
    return this.usersService.uploadPhoto((request.user as any).id, file);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() request: Request) {
    return this.usersService.getProfile((request.user as any).id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() request: Request, @Body() updateData: any) {
    return this.usersService.updateProfile((request.user as any).id, updateData);
  }
}
