import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfigAsync: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
    const isTest = configService.get<string>('NODE_ENV') === 'test';

    return {
      type: 'postgres',
      host: configService.get<string>('DB_HOST', 'localhost'),
      port: Number(configService.get<number>('DB_PORT', 5432)),
      username: configService.get<string>('DB_USERNAME', 'oasis_admin'),
      password: configService.get<string>('DB_PASSWORD', 'oasis_secret'),
      database: configService.get<string>('DB_DATABASE', 'oasis_spa_db'),
      autoLoadEntities: true,
      synchronize: configService.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
      logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
      extra: {
        max: 20,
      },
    };
  },
};
