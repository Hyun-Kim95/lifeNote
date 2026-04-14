import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';

export function configureHttpApp(app: INestApplication): void {
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      exceptionFactory: (errors) => {
        const details = errors.map((e) => ({
          field: e.property,
          issue: Object.values(e.constraints ?? {}).join(', '),
        }));
        return new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: '입력 값을 확인해 주세요.',
          details,
        });
      },
    }),
  );
  app.setGlobalPrefix('v1');

  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((s) => s.trim()) : true,
    credentials: true,
  });
}
