import { Controller, Get, Post, Body, Patch , Param, UseGuards, Req , Delete } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  @Roles(Role.ARCHITECT)
  create(@Req() req, @Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(req.user.id, createClientDto);
  }

  @Patch(':id')
  @Roles(Role.ARCHITECT)
  update(
    @Param('id') id: string,
    @Req() req,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, req.user.id, updateClientDto);
  }

  @Get()
  findAll(@Req() req) {
    return this.clientsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.clientsService.findOne(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.clientsService.remove(id, req.user.id);
  }
}
