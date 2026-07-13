import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Response } from 'express';
import { AuthConfig } from './auth.config';

@Injectable()
export class AuthCookieInterceptor implements NestInterceptor {
  constructor(private authConfig: AuthConfig) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response: Response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((body) => {
        if (body?.accessToken) {
          response.cookie(
            this.authConfig.cookieName,
            body.accessToken,
            this.authConfig.cookieOptions,
          );
        }
        const { accessToken, ...user } = body;
        return user;
      }),
    );
  }
}
