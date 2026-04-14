import { NestFactory } from '@nestjs/core';
import { configureHttpApp } from './app-bootstrap';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureHttpApp(app);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}
bootstrap();
