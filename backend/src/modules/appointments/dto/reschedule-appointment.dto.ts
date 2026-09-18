import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class RescheduleAppointmentDto {
  @ApiProperty({
    example: '2026-09-26T15:00:00.000Z',
    description: 'Nueva fecha y hora de inicio de la cita en formato ISO UTC',
  })
  @IsDateString({}, { message: 'La nueva fecha y hora debe ser un formato ISO UTC válido' })
  @IsNotEmpty({ message: 'La nueva fecha y hora es requerida' })
  startTime: string;
}
