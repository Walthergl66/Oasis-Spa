import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'María José', description: 'Nombres del usuario' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Gómez Pérez', description: 'Apellidos del usuario' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: '+593987654321', description: 'Número telefónico de contacto' })
  @IsString()
  @IsOptional()
  phone?: string;
}
