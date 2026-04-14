import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const requestId =
      (typeof req.headers['x-request-id'] === 'string' &&
        req.headers['x-request-id']) ||
      randomUUID();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const excResponse = exception.getResponse();
      let code = this.defaultCode(status);
      let message = exception.message;
      let details: unknown;

      if (typeof excResponse === 'object' && excResponse !== null) {
        const body = excResponse as Record<string, unknown>;
        if (typeof body.message === 'string') {
          message = body.message;
        } else if (Array.isArray(body.message)) {
          message = body.message.join('; ');
        }
        if (typeof body.code === 'string') {
          code = body.code;
        }
        if (body.details !== undefined) {
          details = body.details;
        }
      }

      res.status(status).json({
        error: { code, message, details, requestId },
      });
      return;
    }

    this.logger.error(exception);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: '일시적인 오류가 발생했습니다.',
        requestId,
      },
    });
  }

  private defaultCode(status: number): string {
    switch (status) {
      case 400:
        return 'VALIDATION_ERROR';
      case 401:
        return 'UNAUTHENTICATED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 429:
        return 'RATE_LIMITED';
      default:
        return status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR';
    }
  }
}
