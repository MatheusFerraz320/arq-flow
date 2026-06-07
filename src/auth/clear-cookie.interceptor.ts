import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Response } from 'express';
import { AUTH_CONFIG } from './auth.config';

@Injectable()
export class ClearCookieInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response: Response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      tap(() => {
        response.clearCookie(AUTH_CONFIG.cookieName, { path: '/' });
      }),
    );
  }
}
