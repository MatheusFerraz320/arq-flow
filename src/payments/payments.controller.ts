import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PayPaymentDto } from './dto/pay-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('projects/:projectId/payments')
  @Roles(Role.ARCHITECT)
  create(
    @Param('projectId') projectId: string,
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req,
  ) {
    return this.paymentsService.create(projectId, req.user.id, createPaymentDto);
  }

  @Get('projects/:projectId/payments')
  findAll(@Param('projectId') projectId: string, @Req() req) {
    return this.paymentsService.findByProject(projectId, req.user.id);
  }

  @Patch('payments/:id/pay')
  @Roles(Role.ARCHITECT)
  pay(
    @Param('id') id: string,
    @Body() payPaymentDto: PayPaymentDto,
    @Req() req,
  ) {
    return this.paymentsService.pay(id, req.user.id, payPaymentDto.paidAt);
  }

  @Delete('payments/:id')
  @Roles(Role.ARCHITECT)
  remove(@Param('id') id: string, @Req() req) {
    return this.paymentsService.remove(id, req.user.id);
  }
}
