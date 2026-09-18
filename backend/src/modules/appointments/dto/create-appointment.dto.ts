import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'ID del servicio que se va a recibir',
  })
  @IsUUID('4', { message: 'El serviceId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de servicio es obligatorio' })
  serviceId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: 'ID del terapeuta o especialista asignado',
  })
  @IsUUID('4', { message: 'El employeeId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de especialista es obligatorio' })
  employeeId: string;

  @ApiProperty({
    example: '2026-09-25T14:00:00.000Z',
    description: 'Fecha y hora de inicio de la cita en formato ISO UTC',
  })
  @IsDateString({}, { message: 'La hora de inicio debe ser una fecha ISO válida (UTC)' })
  @IsNotEmpty({ message: 'La hora de inicio es obligatoria' })
  startTime: string;

  @ApiPropertyOptional({
    example: 'Prefiero aceites con fragancia a lavanda y presión moderada.',
    description: 'Notas o preferencias especiales del cliente',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
