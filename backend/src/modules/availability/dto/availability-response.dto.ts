import { ApiProperty } from '@nestjs/swagger';

export class AvailableSlotDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  employeeId: string;

  @ApiProperty({ example: 'Valeria Morales' })
  employeeName: string;

  @ApiProperty({ example: '2026-09-25T14:00:00.000Z', description: 'Inicio en formato ISO UTC' })
  startTime: string;

  @ApiProperty({ example: '2026-09-25T15:00:00.000Z', description: 'Fin en formato ISO UTC' })
  endTime: string;

  @ApiProperty({ example: '09:00', description: 'Hora local para mostrar al cliente' })
  startTimeFormatted: string;

  @ApiProperty({ example: '10:00', description: 'Hora local para mostrar al cliente' })
  endTimeFormatted: string;
}

export class AvailabilityResponseDto {
  @ApiProperty({ example: '2026-09-25' })
  date: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  serviceId: string;

  @ApiProperty({ example: 'Masaje Relajante' })
  serviceName: string;

  @ApiProperty({ example: 60 })
  durationMinutes: number;

  @ApiProperty({ type: [AvailableSlotDto] })
  availableSlots: AvailableSlotDto[];
}
