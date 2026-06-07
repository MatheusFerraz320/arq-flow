import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  @Roles(Role.ARCHITECT)
  create(@Req() req, @Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(req.user.id, createClientDto);
  }

  @Get()
  findAll(@Req() req) {
    if (req.user.role === Role.ARCHITECT) {
      return this.clientsService.findAll(req.user.id);
    }
    return this.clientsService.findByEmail(req.user.email);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }
}
