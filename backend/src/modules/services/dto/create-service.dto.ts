import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Masaje Relajante con Aromaterapia', description: 'Nombre del servicio' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del servicio es requerido' })
  name: string;

  @ApiPropertyOptional({
    example: 'Masaje corporal completo de 60 minutos con aceites esenciales naturales.',
    description: 'Descripción detallada del servicio',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 60, description: 'Duración en minutos (ej. 30, 45, 60, 90)' })
  @IsInt({ message: 'La duración debe ser un número entero de minutos' })
  @IsPositive({ message: 'La duración debe ser mayor a 0' })
  durationMinutes: number;

  @ApiProperty({ example: 35.0, description: 'Precio del servicio en dólares' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio debe ser un número válido' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  price: number;

  @ApiPropertyOptional({ example: 'Masajes', description: 'Categoría del servicio' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'https://ejemplo.com/fotos/masaje.jpg', description: 'URL de imagen ilustrativa' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: true, default: true, description: 'Estado activo/inactivo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
