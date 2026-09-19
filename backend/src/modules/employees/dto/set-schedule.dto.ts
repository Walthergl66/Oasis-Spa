import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DayScheduleDto {
  @ApiProperty({ example: 1, description: 'Día de la semana: 0=Domingo, 1=Lunes, ..., 6=Sábado' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '09:00', description: 'Hora de inicio de la jornada (formato HH:mm)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime debe tener formato HH:mm (ej. 09:00)',
  })
  startTime: string;

  @ApiProperty({ example: '18:00', description: 'Hora de fin de la jornada (formato HH:mm)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime debe tener formato HH:mm (ej. 18:00)',
  })
  endTime: string;

  @ApiPropertyOptional({ example: '13:00', description: 'Hora de inicio de descanso/almuerzo (formato HH:mm)' })
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'breakStart debe tener formato HH:mm (ej. 13:00)',
  })
  breakStart?: string;

  @ApiPropertyOptional({ example: '14:00', description: 'Hora de fin de descanso/almuerzo (formato HH:mm)' })
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'breakEnd debe tener formato HH:mm (ej. 14:00)',
  })
  breakEnd?: string;

  @ApiPropertyOptional({ example: true, default: true, description: 'Indica si labora este día' })
  @IsBoolean()
  @IsOptional()
  isWorkingDay?: boolean;
}

export class SetScheduleDto {
  @ApiProperty({ type: [DayScheduleDto], description: 'Listado de días y franjas horarias configuradas' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayScheduleDto)
  schedules: DayScheduleDto[];
}
