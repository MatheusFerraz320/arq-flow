import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions } from 'express';

@Injectable()
export class AuthConfig {
  constructor(private configService: ConfigService) {}

  get jwtSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET não está definido no .env');
    }
    return secret;
  }

  get tokenExpiresIn() {
    return '7d' as const;
  }

  get cookieName(): string {
    return 'arqflow_token';
  }

  get cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }
}
