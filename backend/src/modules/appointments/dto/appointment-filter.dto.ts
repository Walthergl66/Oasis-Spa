import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AppointmentStatus } from '../enums/appointment-status.enum.js';

export class AppointmentFilterDto {
  @ApiPropertyOptional({ enum: AppointmentStatus, description: 'Filtrar por estado de la cita' })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Filtrar citas asignadas a un empleado específico' })
  @IsUUID('4')
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Filtrar citas de un cliente específico' })
  @IsUUID('4')
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ example: '2026-09-01T00:00:00.000Z', description: 'Fecha inicio de rango' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30T23:59:59.000Z', description: 'Fecha fin de rango' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
