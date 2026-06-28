import { CookieOptions } from 'express';

export const AUTH_CONFIG = {
  jwtSecret: process.env.JWT_SECRET || 'arqflow-dev-secret-change-in-production',
  tokenExpiresIn: '7d',
  cookieName: 'arqflow_token',

  get cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  },
} as const;
