import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger(bootstrap.name);
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'log', 'warn', 'debug'],
  });
  const configService = app.get(ConfigService);
  app.enableVersioning();
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'),
    credentials: true,
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

  const port = configService.get<number>('PORT') ?? 4000;
  await app.listen(port);
  logger.debug(`Application is running on : http://127.0.0.1:${port}/api`);
  logger.debug(`Swagger is running on : http://127.0.0.1:${port}/docs`);
}
void bootstrap();
