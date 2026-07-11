import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../interface/api-response.interface';
import { RequestWithId } from '../types/request.type';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    const timestamp = new Date().toISOString();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Something went wrong';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const errorMessage = (
          exceptionResponse as {
            message: string | string[];
          }
        ).message;

        if (Array.isArray(errorMessage)) {
          code = 'VALIDATION_FAILED';
          message = 'Validation failed';
          details = errorMessage;
        } else {
          message = errorMessage;
          code = HttpStatus[status] ?? 'HTTP_ERROR';
        }
      } else {
        message = exception.message;
        code = HttpStatus[status] ?? 'HTTP_ERROR';
      }
    } else {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
        {
          requestId: request.requestId,
          method: request.method,
          url: request.url,
        },
      );
    }

    if (exception instanceof HttpException && status >= 400 && status < 500) {
      this.logger.warn({
        requestId: request.requestId,
        method: request.method,
        url: request.url,
        status,
        code,
      });
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined && { details }),
      },
      meta: {
        timestamp,
        requestId: request.requestId,
      },
    };

    response.status(status).json(errorResponse);
  }
}
