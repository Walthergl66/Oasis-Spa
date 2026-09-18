import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class GetAvailabilityDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'ID del servicio a consultar',
  })
  @IsUUID('4', { message: 'El serviceId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de servicio es requerido' })
  serviceId: string;

  @ApiProperty({
    example: '2026-09-25',
    description: 'Fecha a consultar en formato YYYY-MM-DD',
  })
  @IsDateString({}, { message: 'La fecha debe tener formato YYYY-MM-DD válido' })
  @IsNotEmpty({ message: 'La fecha de consulta es requerida' })
  date: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: 'ID de un especialista específico (opcional, si se omite busca entre todos)',
  })
  @IsUUID('4', { message: 'El employeeId debe ser un UUID válido' })
  @IsOptional()
  employeeId?: string;
}
