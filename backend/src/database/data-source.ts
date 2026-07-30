import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ENTITIES } from './entities';

/**
 * DataSource para la CLI de TypeORM (migraciones y seed).
 *
 * Es independiente del contenedor de Nest a propósito: las migraciones deben
 * poder ejecutarse en un pipeline sin levantar la aplicación completa.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'postgres',
  entities: ENTITIES,
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Nota: una sola exportación de DataSource. La CLI de TypeORM rechaza el
// archivo si encuentra además una exportación por defecto.
