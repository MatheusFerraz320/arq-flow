import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthCookieInterceptor } from './auth-cookie.interceptor';
import { ClearCookieInterceptor } from './clear-cookie.interceptor';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseInterceptors(AuthCookieInterceptor)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('logout')
  @UseInterceptors(ClearCookieInterceptor)
  logout() {
    return { message: 'Logout realizado com sucesso' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: Request) {
    return request.user;
  }
}
