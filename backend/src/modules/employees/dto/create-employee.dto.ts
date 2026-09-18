import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID de usuario existente con rol EMPLOYEE' })
  @IsUUID('4', { message: 'El ID de usuario debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de usuario es obligatorio' })
  userId: string;

  @ApiPropertyOptional({ example: 'Especialista en Masoterapia y Drenaje Linfático' })
  @IsString()
  @IsOptional()
  specialty?: string;

  @ApiPropertyOptional({ example: 'Terapeuta con más de 8 años de experiencia en masajes relajantes y descontracturantes.' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({
    example: ['123e4567-e89b-12d3-a456-426614174001'],
    description: 'Lista de IDs de servicios que puede realizar este empleado',
  })
  @IsArray()
  @IsUUID('4', { each: true, message: 'Cada ID de servicio debe ser un UUID válido' })
  @IsOptional()
  serviceIds?: string[];

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
