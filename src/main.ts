import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger(bootstrap.name);
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const configService = app.get(ConfigService);
  app.enableVersioning({ type: VersioningType.URI });
  app.setGlobalPrefix('api');
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  if (!frontendUrl) {
    logger.warn('FRONTEND_URL not set — CORS will block browser requests');
  }
  app.enableCors({
    origin: frontendUrl ?? false,
    credentials: !!frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Feedbook API')
    .setDescription('Feedbook API documentation')
    .addBearerAuth()
    .build();

  const swaggerDocument = () =>
    SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(helmet());
  app.enableShutdownHooks();

  const port = configService.get<number>('PORT') ?? 4000;
  await app.listen(port);
  logger.log(`Application is running on : http://127.0.0.1:${port}/api`);
  logger.log(`Swagger is running on : http://127.0.0.1:${port}/docs`);
}
void bootstrap();
