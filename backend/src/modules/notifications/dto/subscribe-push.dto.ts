import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class PushKeysDto {
  @ApiProperty({ description: 'Clave pública p256dh de la suscripción Push' })
  @IsString()
  @IsNotEmpty()
  p256dh: string;

  @ApiProperty({ description: 'Secreto auth de la suscripción Push' })
  @IsString()
  @IsNotEmpty()
  auth: string;
}

export class SubscribePushDto {
  @ApiProperty({
    example: 'https://fcm.googleapis.com/fcm/send/abc123',
    description: 'Endpoint Push entregado por el navegador/PWA',
  })
  @IsUrl({}, { message: 'El endpoint debe ser una URL válida' })
  @IsNotEmpty()
  endpoint: string;

  @ApiProperty({ type: PushKeysDto, description: 'Claves de cifrado Push' })
  @IsObject()
  keys: PushKeysDto;

  @ApiPropertyOptional({
    example: 'Mozilla/5.0 (Android) PWA Oasis Spa',
    description: 'User-Agent del dispositivo para identificarlo',
  })
  @IsString()
  @IsOptional()
  userAgent?: string;
}
