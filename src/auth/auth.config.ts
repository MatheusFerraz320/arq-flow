import { CookieOptions } from 'express';


const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
  throw new Error('JWT_SECRET is not defined');
}

export const AUTH_CONFIG = {
  jwtSecret,
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
