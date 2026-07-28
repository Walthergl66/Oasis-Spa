import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ENTITIES } from '../database/entities';

/**
 * Configuración de la conexión a PostgreSQL (Supabase).
 *
 * `synchronize` queda apagado por defecto: el esquema se aplica con
 * migraciones, que son revisables y reversibles. Dejarlo encendido permitiría
 * que un cambio accidental en una entidad alterara la base de producción.
 */
export const buildDatabaseConfig = (
  config: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.get<string>('DB_HOST', 'localhost'),
  port: Number(config.get<string>('DB_PORT', '5432')),
  username: config.get<string>('DB_USERNAME', 'postgres'),
  password: config.get<string>('DB_PASSWORD', 'postgres'),
  database: config.get<string>('DB_NAME', 'postgres'),
  entities: ENTITIES,
  synchronize: config.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
  logging: config.get<string>('DB_LOGGING', 'false') === 'true',
  // Supabase exige TLS; el certificado es de una CA gestionada por ellos.
  ssl:
    config.get<string>('DB_SSL', 'false') === 'true'
      ? { rejectUnauthorized: false }
      : false,
});
