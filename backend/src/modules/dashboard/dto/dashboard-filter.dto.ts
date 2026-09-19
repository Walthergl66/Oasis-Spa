import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '../../appointments/enums/appointment-status.enum.js';

export class DashboardRangeDto {
  @ApiPropertyOptional({ example: '2026-09-01T00:00:00.000Z', description: 'Inicio del rango (defecto: hace 30 días)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30T23:59:59.000Z', description: 'Fin del rango (defecto: ahora)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class TopServicesQueryDto extends DashboardRangeDto {
  @ApiPropertyOptional({ example: 5, description: 'Top N servicios (1-20)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  limit?: number;
}

export class OccupancyQueryDto {
  @ApiPropertyOptional({ example: '2026-09-25', description: 'Día a evaluar YYYY-MM-DD (defecto: hoy del spa)' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ description: 'Un solo especialista (opcional)' })
  @IsUUID('4')
  @IsOptional()
  employeeId?: string;
}

export class HistoryQueryDto {
  @ApiPropertyOptional({ example: '2026-09-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30T23:59:59.000Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filtrar por especialista' })
  @IsUUID('4')
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por servicio' })
  @IsUUID('4')
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;
}
