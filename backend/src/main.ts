import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Las dos aplicaciones apuntan a http://localhost:3000/api.
  app.setGlobalPrefix('api');

  // Necesario para leer la cookie httpOnly con el refresh token.
  app.use(cookieParser());

  // `credentials: true` es lo que permite que el navegador envíe esa cookie
  // en las peticiones a /api/auth/refresh desde otro puerto.
  const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({ origin: origins, credentials: true });

  // Valida y transforma los DTO de entrada; descarta propiedades no declaradas.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API escuchando en http://localhost:${port}/api`);
}

void bootstrap();
