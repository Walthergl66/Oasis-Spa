import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

export class CreateAvailabilityDto {
  @IsUUID()
  employeeId: string;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @Matches(TIME_24H_REGEX, {
    message: 'startTime must use HH:mm or HH:mm:ss format',
  })
  startTime: string;

  @Matches(TIME_24H_REGEX, {
    message: 'endTime must use HH:mm or HH:mm:ss format',
  })
  endTime: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
