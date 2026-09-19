import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export enum LlmProviderType {
  Mock = 'mock',
  OpenAI = 'openai',
  Gemini = 'gemini',
}

export class EnvironmentVariables {
  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsString()
  @IsOptional()
  API_PREFIX: string = 'api/v1';

  @IsString()
  @IsOptional()
  DB_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  DB_PORT: number = 5432;

  @IsString()
  @IsOptional()
  DB_USERNAME: string = 'oasis_admin';

  @IsString()
  @IsOptional()
  DB_PASSWORD: string = 'oasis_secret';

  @IsString()
  @IsOptional()
  DB_DATABASE: string = 'oasis_spa_db';

  @IsString()
  @IsOptional()
  JWT_SECRET: string = 'oasis_spa_jwt_secret_key_titulacion_2026_super_secure';

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '1d';

  @IsString()
  @IsOptional()
  JWT_REFRESH_SECRET: string = 'oasis_spa_refresh_secret_key_titulacion_2026_super_secure';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @IsString()
  @IsOptional()
  SPA_TIMEZONE: string = 'America/Guayaquil';

  @IsEnum(LlmProviderType)
  @IsOptional()
  LLM_PROVIDER: LlmProviderType = LlmProviderType.Mock;

  @IsString()
  @IsOptional()
  OPENAI_API_KEY?: string;

  @IsString()
  @IsOptional()
  GEMINI_API_KEY?: string;

  @IsString()
  @IsOptional()
  VAPID_PUBLIC_KEY?: string;

  @IsString()
  @IsOptional()
  VAPID_PRIVATE_KEY?: string;

  @IsString()
  @IsOptional()
  VAPID_SUBJECT?: string;

  @IsString()
  @IsOptional()
  GEMINI_API_KEY?: string;

  @IsString()
  @IsOptional()
  LLM_MODEL?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors.toString()}`);
  }
  return validatedConfig;
}
