import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Response } from 'express';
import { AUTH_CONFIG } from './auth.config';

@Injectable()
export class AuthCookieInterceptor implements NestInterceptor {  // executa antes do controller
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response: Response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((body) => {
        if (body?.accessToken) {
          response.cookie(
            AUTH_CONFIG.cookieName,
            body.accessToken,
            AUTH_CONFIG.cookieOptions,
          );
        }
        const { accessToken, ...user } = body;
        return user;
      }),
    );
  }
}
