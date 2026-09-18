import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ServiceFilterDto {
  @ApiPropertyOptional({ description: 'Filtrar por categoría (ej. Facial, Masajes)' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Filtrar solo activos (true) o inactivos (false)' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Buscar por término en el nombre o descripción' })
  @IsString()
  @IsOptional()
  search?: string;
}
