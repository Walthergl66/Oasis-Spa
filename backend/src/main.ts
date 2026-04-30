import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { DatabaseExceptionFilter } from './common/filters/database-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  const port = configService.get<number>('PORT') ?? 3000;

  app.use(helmet());
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new DatabaseExceptionFilter());
  app.enableCors({
    origin: frontendUrl ?? true,
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Oasis Spa API')
    .setDescription('Backend API for Oasis Spa appointment management platform')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(port);
}
bootstrap();
