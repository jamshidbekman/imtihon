import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

export class Interceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => {
        return {
          success: true,
          message: data.message,
          data: data.data,
        };
      }),
    );
  }
}
