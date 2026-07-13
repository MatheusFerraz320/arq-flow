import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Response } from 'express';
import { AuthConfig } from './auth.config';

@Injectable()
export class ClearCookieInterceptor implements NestInterceptor {
  constructor(private authConfig: AuthConfig) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response: Response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      tap(() => {
        response.clearCookie(this.authConfig.cookieName, { path: '/' });
      }),
    );
  }
}
