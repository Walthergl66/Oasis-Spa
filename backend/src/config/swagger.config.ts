import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Documentación interactiva de la API (OpenAPI / Swagger).
 *
 * Queda **desactivada por defecto**: publica el mapa completo de endpoints,
 * parámetros y respuestas, que es exactamente lo que necesitaría alguien para
 * atacar el sistema. Se enciende con `SWAGGER_ENABLED=true`, pensado para
 * desarrollo; en producción se deja apagada salvo decisión explícita.
 */
export function setupSwagger(app: INestApplication): string | null {
  if (process.env.SWAGGER_ENABLED !== 'true') return null;

  const config = new DocumentBuilder()
    .setTitle('API Oasis Spa')
    .setDescription(
      [
        'API de gestión de citas y servicios para spas de belleza.',
        '',
        '**Autenticación.** Casi todos los endpoints exigen sesión. Para probarlos:',
        '',
        '1. Ejecuta `POST /api/auth/login` con una cuenta válida.',
        '2. Copia el `accessToken` de la respuesta.',
        '3. Pulsa **Authorize** (arriba a la derecha) y pégalo.',
        '',
        'El *refresh token* no aparece en las respuestas: viaja en una cookie',
        '`httpOnly` que el navegador envía sola a `/api/auth/refresh`.',
        '',
        'Los endpoints marcados como públicos no requieren token.',
      ].join('\n'),
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token devuelto por /api/auth/login',
      },
      'bearer',
    )
    .addTag('auth', 'Registro, sesión, confirmación de correo y recuperación')
    .addTag('categories', 'Categorías del catálogo')
    .addTag('services', 'Servicios del spa')
    .addTag('users', 'Perfiles de usuario')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const ruta = 'api/docs';

  SwaggerModule.setup(ruta, app, document, {
    // Conserva el token entre recargas: evita reautenticarse en cada prueba.
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'API Oasis Spa',
  });

  return ruta;
}
