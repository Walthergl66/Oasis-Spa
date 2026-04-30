import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { getDataSourceOptions } from '../config/database.config';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const configService = new ConfigService(process.env);

export default new DataSource(getDataSourceOptions(configService));
