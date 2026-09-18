import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CancelAppointmentDto {
  @ApiPropertyOptional({
    example: 'Surgió una emergencia familiar imprevista.',
    description: 'Motivo por el cual se cancela la cita',
  })
  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'El motivo debe contener al menos 3 caracteres' })
  reason?: string;
}
