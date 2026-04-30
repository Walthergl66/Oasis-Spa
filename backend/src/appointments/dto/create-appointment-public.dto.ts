import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

export class CreateAppointmentPublicDto {
  @IsUUID()
  spaId: string;

  @IsUUID()
  serviceId: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @Matches(DATE_ONLY_REGEX, {
    message: 'appointmentDate must use YYYY-MM-DD format',
  })
  appointmentDate: string;

  @Matches(TIME_24H_REGEX, {
    message: 'startTime must use HH:mm or HH:mm:ss format',
  })
  startTime: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

