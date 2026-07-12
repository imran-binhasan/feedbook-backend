import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import {
  ApiSuccessResponse,
  CursorPaginatedResult,
} from '../interface/api-response.interface';

function isCursorPaginated<T>(data: unknown): data is CursorPaginatedResult<T> {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return Array.isArray(obj.items) && 'nextCursor' in obj && 'hasMore' in obj;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T | CursorPaginatedResult<T>,
  ApiSuccessResponse<T | T[]> | void
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T | CursorPaginatedResult<T>>,
  ): Observable<ApiSuccessResponse<T | T[]> | void> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((result) => {
        if (response.statusCode === HttpStatus.NO_CONTENT) {
          return undefined;
        }

        const request = context.switchToHttp().getRequest();
        const timestamp = new Date().toISOString();

        if (isCursorPaginated<T>(result)) {
          return {
            success: true as const,
            data: result.items,
            meta: {
              timestamp,
              requestId: request.requestId,
              pagination: {
                nextCursor: result.nextCursor,
                hasMore: result.hasMore,
              },
            },
          };
        }

        return {
          success: true as const,
          data: result,
          meta: {
            timestamp,
            requestId: request.requestId,
          },
        };
      }),
    );
  }
}
