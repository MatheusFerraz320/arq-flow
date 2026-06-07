import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { AUTH_CONFIG } from './auth.config';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: AUTH_CONFIG.jwtSecret,
      signOptions: { expiresIn: AUTH_CONFIG.tokenExpiresIn },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
